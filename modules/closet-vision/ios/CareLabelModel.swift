import Foundation

#if canImport(FoundationModels)
  import FoundationModels

  @available(iOS 26.0, macOS 26.0, *)
  @Generable(description: "What a clothing care label states, copied from its text")
  struct CareLabelFields {
    @Guide(
      description:
        "Each fibre the label names with its percentage, for example 95% cotton or 100% bomull. Empty when the label names no fibre."
    )
    var materials: [CareLabelMaterial]
    @Guide(description: "The garment size exactly as printed, for example M, XL or 38. Left out when no size is printed.")
    var size: String?
    @Guide(description: "The brand name exactly as printed. Left out when no brand is printed.")
    var brand: String?
    @Guide(
      description:
        "The country after made in, laget i or produsert i, exactly as printed. Left out when no country is printed."
    )
    var origin: String?
  }

  @available(iOS 26.0, macOS 26.0, *)
  @Generable(description: "One fibre on a care label")
  struct CareLabelMaterial {
    @Guide(description: "The fibre name exactly as printed, for example cotton, polyester, bomull or viskose")
    var fibre: String
    @Guide(
      description:
        "The whole number percentage printed next to the fibre, from 0 to 100. Left out when no percentage is printed."
    )
    var percent: Int?
  }
#endif

enum CareLabelModel {
  static let instructions =
    "You read the text of a clothing care label. Fill in only what the label text states and copy each value exactly as printed. Leave a field out when the label does not state it. Never guess, translate or add anything."

  static func isAvailable() -> Bool {
    #if canImport(FoundationModels)
      if #available(iOS 26.0, macOS 26.0, *) {
        let model = SystemLanguageModel.default
        guard case .available = model.availability else { return false }
        return model.supportsLocale()
      }
    #endif
    return false
  }

  static func extract(_ text: String) async -> String? {
    let label = text.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !label.isEmpty, isAvailable() else { return nil }
    #if canImport(FoundationModels)
      if #available(iOS 26.0, macOS 26.0, *) {
        do {
          let session = LanguageModelSession(instructions: instructions)
          #if compiler(>=6.4)
            let options = GenerationOptions(samplingMode: .greedy)
          #else
            let options = GenerationOptions(sampling: .greedy)
          #endif
          let response = try await session.respond(
            to: label,
            generating: CareLabelFields.self,
            options: options
          )
          return response.content.generatedContent.jsonString
        } catch {
          return nil
        }
      }
    #endif
    return nil
  }
}
