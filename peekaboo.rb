require 'pathname'
require 'digest'
require 'uri'
require 'shellwords'
require 'time'

base_foldr   = Pathname.new("../tmp")
@screenshotjs_path = Pathname.new('./screenshot.js').realpath

def get_screenshot(url, image_file, selector)
  cmd = Shellwords.join(['phantomjs', @screenshotjs_path, url, image_file, selector])
  puts %x{#{cmd}}
end

[
  ['https://google.com', 'img'],
  ['https://kktix.com', 'xpath://*[contains(concat( " ", @class, " " ), concat( " ", "index-featured", " " ))]'],
  ['https://kktix.com', 'xpath://*[contains(concat( " ", @class, " " ), concat( " ", "expansion", " " ))]'],
  ['http://www.appledaily.com.tw/', '#realtimenews'],
].each do |t|
  url      = t[0]
  selector = t[1]

  puts "="*10 + " " + url + " selector:" + selector

  host = URI.parse(url).host
  foldr = base_foldr + host

  foldr.mkpath if !File.exists?( base_foldr + host)
  file_path = foldr + (Digest::MD5.hexdigest(selector)+".png")
  get_screenshot(url, file_path.expand_path, selector)
  Dir.chdir(base_foldr)
  %x{git add . && git commit -a -m '#{host} - #{Time.now.to_s}' && git push}
end


