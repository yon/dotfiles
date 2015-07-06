" myfiletypefile
if has("autocmd")
  augroup filetype
    " set appropriate filetypes on opening a new file event
    autocmd! BufRead,BufNewFile   *.adp                   set filetype=adp
    autocmd! BufRead,BufNewFile   *.apt                   set filetype=apt
    autocmd! BufRead,BufNewFile   *.log                   set filetype=log
    autocmd! BufRead,BufNewFile   *.p4*                   set filetype=p4
    autocmd! BufRead,BufNewFile   *.pdl                   set filetype=pdl
    autocmd! BufRead,BufNewFile   *.properties            set filetype=java
    autocmd! BufRead,BufNewFile   *.vcf                   set filetype=vcf
    autocmd! BufRead,BufNewFile   *.xql                   set filetype=xql
  augroup end
endif
