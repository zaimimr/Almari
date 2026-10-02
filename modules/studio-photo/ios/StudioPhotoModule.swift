import ExpoModulesCore
import Foundation
import MLX
import UIKit
import os

final class StudioQueue {
  static let shared = StudioQueue()

  private let queue = DispatchQueue(label: "closet.studio.render")
  private let lock = NSLock()
  private var engine: StudioEngine?
  private var stop = false
  private var waiting = 0

  private var photos: URL {
    FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
      .appendingPathComponent("closet-photos", isDirectory: true)
  }

  static var supported: Bool {
    #if targetEnvironment(simulator)
      return false
    #else
      return ProcessInfo.processInfo.physicalMemory >= 7_500_000_000
    #endif
  }

  init() {
    for name in [UIApplication.didEnterBackgroundNotification, UIApplication.didReceiveMemoryWarningNotification] {
      NotificationCenter.default.addObserver(forName: name, object: nil, queue: nil) { [weak self] _ in
        self?.cancelAll()
      }
    }
  }

  func cancelAll() {
    lock.lock()
    stop = true
    lock.unlock()
    queue.async { [weak self] in self?.unload() }
  }

  private var cancelled: Bool {
    lock.lock()
    defer { lock.unlock() }
    return stop
  }

  private func unload() {
    engine = nil
    Memory.clearCache()
  }

  private func check() throws {
    if ProcessInfo.processInfo.thermalState.rawValue >= ProcessInfo.ThermalState.serious.rawValue {
      throw StudioError.thermal
    }
    if engine == nil && os_proc_available_memory() < 4_300_000_000 { throw StudioError.memory }
  }

  private func loadEngine() throws -> StudioEngine {
    if let engine { return engine }
    let store = StudioModelStore.shared
    guard store.ready,
      let bundleUrl = Bundle(for: StudioQueue.self).url(forResource: "StudioPhotoResources", withExtension: "bundle"),
      let prompt = Bundle(url: bundleUrl)?.url(forResource: "studio-prompt", withExtension: "safetensors")
    else { throw StudioError.missing }
    let loaded = try StudioEngine(
      transformer: StudioModelStore.parts.prefix(2).map(store.url), autoencoder: store.url(StudioModelStore.parts[2]),
      prompt: prompt)
    engine = loaded
    return loaded
  }

  func render(cutout: String, id: String) async throws -> String {
    lock.lock()
    if waiting == 0 { stop = false }
    waiting += 1
    lock.unlock()
    return try await withCheckedThrowingContinuation { continuation in
      queue.async { [self] in
        defer {
          lock.lock()
          waiting -= 1
          let idle = waiting == 0
          lock.unlock()
          if idle { unload() }
        }
        do {
          if cancelled { throw StudioError.cancelled }
          try check()
          let engine = try loadEngine()
          let name = "\(id)-studio.png"
          try engine.render(
            photos.appendingPathComponent(cutout), to: photos.appendingPathComponent(name),
            cancelled: { self.cancelled || ProcessInfo.processInfo.thermalState == .critical })
          continuation.resume(returning: name)
        } catch {
          continuation.resume(throwing: error)
        }
      }
    }
  }
}

struct StudioModelState: Record {
  @Field var supported: Bool = false
  @Field var ready: Bool = false
  @Field var bytes: Double = 0
  @Field var size: Double = 0
}

public class StudioPhotoModule: Module {
  public func definition() -> ModuleDefinition {
    Name("StudioPhoto")

    Events("onDownload")

    AsyncFunction("modelState") { () -> StudioModelState in
      var state = StudioModelState()
      state.supported = StudioQueue.supported
      state.ready = StudioModelStore.shared.ready
      state.bytes = Double(StudioModelStore.shared.storedBytes)
      state.size = Double(StudioModelStore.size)
      return state
    }

    AsyncFunction("download") { () async throws in
      var sent: Int64 = -1
      try await StudioModelStore.shared.download { [weak self] bytes in
        guard bytes - sent >= 8_000_000 || bytes == StudioModelStore.size else { return }
        sent = bytes
        self?.sendEvent("onDownload", ["bytes": Double(bytes), "size": Double(StudioModelStore.size)])
      }
    }

    AsyncFunction("cancelDownload") { () in
      StudioModelStore.shared.cancel()
    }

    AsyncFunction("deleteModel") { () throws in
      StudioQueue.shared.cancelAll()
      try StudioModelStore.shared.remove()
    }

    AsyncFunction("render") { (cutout: String, id: String) async throws -> String in
      try await StudioQueue.shared.render(cutout: cutout, id: id)
    }
  }
}
