import ExpoModulesCore

public class AccessibilityLanguageModule: Module {
  public func definition() -> ModuleDefinition {
    Name("AccessibilityLanguage")
    Function("set") { (tag: String) in
      DispatchQueue.main.async { UIApplication.shared.accessibilityLanguage = tag }
    }
  }
}
