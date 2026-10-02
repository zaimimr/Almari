Pod::Spec.new do |s|
  s.name           = 'StudioPhoto'
  s.version        = '0.1.0'
  s.summary        = 'On-device studio product photos'
  s.description    = 'Turns a garment cutout into a studio product photo with FLUX.2 klein 4B on MLX.'
  s.author         = 'Zaim Imran'
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = { :ios => '26.0' }
  s.source         = { git: '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.frameworks     = 'CoreImage', 'UIKit'
  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
  s.source_files   = '*.swift'
  s.resource_bundles = { 'StudioPhotoResources' => ['Resources/*'] }
  spm_dependency(s,
    url: 'https://github.com/ml-explore/mlx-swift',
    requirement: { kind: 'exactVersion', version: '0.31.6' },
    products: ['MLX', 'MLXNN', 'MLXFast', 'MLXRandom']
  )
end
