set shiftwidth=2
set softtabstop=2

" on file saves events call convert apt file to a different format
" autocmd! BufWritePost,FileWritePost   *.apt     call APT_Convert("html")
" autocmd! BufWritePost,FileWritePost   *.apt     call APT_Convert("xml")
" autocmd! BufWritePost,FileWritePost   *.apt     call APT_Convert("pdf")

function! APT_Convert(format)
  " generic conversion function takes a format (html, xml, pdf)
  " 
  " execute ":! aptconvert "              calling aptconvert
  " expand("%:r") . "." . a:format        first parameter is current filename
  "                                       stripped of its extension then
  "                                       concatenated with the format arg
  " . " " . expand("%")                   second parameter is the current
  "                                       filename
  execute ":! aptconvert " . expand("%:r") . "." . a:format . " " . expand("%")
endfunction
