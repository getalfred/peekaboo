# peekaboo
汎用網頁差異監控系統

## Requirement

* SlimerJS 0.10.0
* xvfb (ref. https://docs.slimerjs.org/current/installation.html#having-a-headless-slimerjs)
* ruby 2.3

## Quick Start

* create a new github repo and clone to local
* copy `peekaboo.yml.example` to `peekaboo.yml`
* upadte  `peekaboo.yml` `git_repo_path` value to local path
* run `bundle install`
* run `bundle exec ./peekaboo.rb`

## FAQ

#### why not use PhantomJS

PhantomJS cant screeshot `https://www.skbank.com.tw/2006_credit/credit_01.asp`
