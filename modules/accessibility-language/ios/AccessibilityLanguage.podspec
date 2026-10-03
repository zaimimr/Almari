Pod::Spec.new do |s|
  s.name           = 'AccessibilityLanguage'
  s.version        = '0.1.0'
  s.summary        = 'VoiceOver language follows the app language'
  s.description    = 'Sets the accessibility language of the app so VoiceOver reads in the chosen language.'
  s.author         = 'Zaim Imran'
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = { :ios => '26.0' }
  s.source         = { git: '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
  s.source_files   = '*.swift'
end
