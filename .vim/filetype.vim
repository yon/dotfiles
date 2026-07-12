" myfiletypefile
if has("autocmd")
  augroup filetype
    " set appropriate filetypes on opening a new file event
    autocmd! BufRead,BufNewFile   *.log                   set filetype=log
    autocmd! BufRead,BufNewFile   *.properties            set filetype=java
  augroup end
endif
