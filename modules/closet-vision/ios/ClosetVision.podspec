Pod::Spec.new do |s|
  s.name           = 'ClosetVision'
  s.version        = '0.1.0'
  s.summary        = 'On-device garment cutout and recognition'
  s.description    = 'Prepares clothing photos with Apple Vision and a Core ML garment classifier.'
  s.author         = 'Zaim Imran'
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = { :ios => '26.0' }
  s.source         = { git: '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.frameworks     = 'Vision', 'CoreML', 'CoreImage', 'WeatherKit', 'MapKit', 'CoreLocation', 'AVFoundation'
  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
  s.source_files   = '*.swift'
  s.resource_bundles = { 'ClosetVisionResources' => ['Resources/*'] }
end
