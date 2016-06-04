#!/bin/env ruby
require 'pathname'
require 'digest'
require 'uri'
require 'shellwords'
require 'time'
require 'net/http'
require 'yaml'
require 'open-uri'
require 'csv'
require 'json'

CONFIG = YAML.load_file('peekaboo.yml')

SCREENSHOTJS_PATH = Pathname.new('./screenshot.js').realpath
GIT_REPO_PATH     = Pathname.new( CONFIG['git_repo_path'])

# use phantomjs get screen & push to github
def screenshot(url, selector)
  host  = URI.parse(url).host
  foldr = GIT_REPO_PATH + host

  foldr.mkpath if !File.exists?( foldr )
  image_filename = Digest::MD5.hexdigest( url + selector )+".png"
  image_path     = (foldr + image_filename).expand_path

  cmd = Shellwords.join(['phantomjs', SCREENSHOTJS_PATH, url, image_path, selector])
  puts %x{#{cmd}}

  # update git repo & push to remote repo
  Dir.chdir(GIT_REPO_PATH)
  commit_message = "#{url} - #{Time.now.to_s}"
  %x{git add . && git commit -a -m #{Shellwords.escape(commit_message)} && git push 2>&1}
end

# get all pages
def pages
  pages = CONFIG["pages"].dup
  CONFIG["import_csv_urls"].each do |csv_url|
    csv_data = open(csv_url,'r').read.force_encoding('utf-8')
    CSV.parse(csv_data) do |row|
      pages << {
        "title"    =>  row[0],
        "url"      =>  row[1],
        "selector" =>  row[2]
      }
    end
  end
  pages
end

def send_slack_message(message)
  data = {
    "username":   CONFIG["slack"]["username"],
    "icon_emoji": CONFIG["slack"]["icon_emoji"],
    "channel":    CONFIG["slack"]["channel"],
    "text":       message
  }
  uri = URI CONFIG["slack"]["incoming_webhook_url"]
  http = Net::HTTP.new uri.host, uri.port
  http.use_ssl = true
  response = http.post(CONFIG["slack"]["incoming_webhook_url"], data.to_json)
end

pages.each do |page|
  puts "===== #{page["url"]} ===== "
  result = screenshot(page["url"], page["selector"])
  puts result
  matches = result.match(/[a-z0-9]{7}\.\.(?<commit_hash>[a-z0-9]{7})/)

  if matches
    project_url = "https://github.com/#{CONFIG["github_repo"]}/commit/#{matches[:commit_hash]}"
    message = "#{page['title']} #{page["url"]} has been updated <#{project_url}| #{project_url}>"
    puts message
    send_slack_message(message)
  end
end


