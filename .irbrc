require 'irb/completion'
require 'irb/ext/save-history'
require 'pp'
require 'rubygems'

IRB.conf[:AUTO_INDENT] = true
IRB.conf[:EVAL_HISTORY] = 1000
IRB.conf[:HISTORY_FILE] = "#{ENV['HOME']}/.irb_history"
IRB.conf[:PROMPT_MODE] = :SIMPLE
IRB.conf[:SAVE_HISTORY] = 1000
IRB.conf[:USE_READLINE] = true
