" make sure we use vim not vi settings
set nocompatible

set autoindent
set autowrite
set backspace=indent,eol,start
set expandtab
set history=50
set ignorecase
set matchtime=2
set noerrorbells
set nohlsearch
set nomesg
set noshowmode
set noswapfile
set notitle
set report=5
set ruler
set shiftround
set shiftwidth=4
set shortmess=filnxtToOI
set showmatch
set sidescroll=1
set smartcase
set softtabstop=4
set splitbelow
set t_kb=
set tabstop=8
set tags=$TAGS
set textwidth=78
set viminfo='0,f0,\"100,:100,/100,@100,%,h,n$HOME/.vim/viminfo
set whichwrap=b,s,h,l
set wrapscan

" fix backspace to actually backspace
fixdel

" i always fuck these up
abbr $versionId$ $Id$ by $Author$, $DateTime$
abbr $id$ $Id$

" these abbreviations insert the current date into the buffer.
iabbr yd <c-r>=strftime("%b %d, %Y")<cr>
iabbr yld <c-r>=strftime("%a %b %d, %Y %H:%M:%S %Z")<cr>

" make ' do the same as `, that is return to row AND column
map ` '

" make [ and ] move the buffer up and down while keeping the cursor in the
" position.
map [ M
map ] M

" emulate emacs' meta-.
nmap ³ :tag <c-r>=expand("<cword>")<cr><cr>

" make + and - increment and decrement numbers.
nmap + <c-a>
nmap - <c-x>

" save current buffer and hop to the next one
nmap <c-n> :w<cr>:n<cr>
nmap <c-v> :new<cr>:0r ! 

" turn on syntax mode
syntax on

" on filetype event source type specific configuration file
autocmd FileType                        *         call Source_FT_RC()

function! Source_FT_RC()
  " source type specific configuration file
  "
  " configuration file is: $HOME/.vim/ + filetype + .vim
  " if the file exists and is readable then
  "   source the file
  " done
  let rcfile = $HOME . "/.vim/" . &filetype . ".vim"
  if filereadable(rcfile)
    execute "source " rcfile
  endif
endfunction

" on new file event insert type specific template into the buffer
autocmd BufNewFile                      *         call Load_FT_Template()

function! Load_FT_Template()
  " load a template based on filetype
  "
  " template file is: $HOME/.vim/templates/filetype
  " if the template file exists and is readable then
  "   read the file into the new buffer
  "   replace the file path place holder with the file path of this buffer
  "   replace the creation date place holder with the current date
  "   replace the hostname place holder with the current hostname
  "   delete extra newline at the end of the file
  " done
  " license file is: $HOME/.vim/licenses/filetype
  " if the license file exists and is readable then
  "   read the file into the top of the new buffer
  " done
  let templatefile = $HOME . "/.vim/templates/" . &filetype
  if filereadable(templatefile)
    execute ":0r " templatefile
    execute ":%s/__file_name__/" . expand("%") . "/eg"
    execute ":%s/__file_name_root__/" . expand("%:r") . "/eg"
    execute ":%s/__creation_date__/" . strftime("%Y-%m-%d") . "/eg"
    execute ":%s/__hostname__/" . $HOSTNAME . "/eg"
    execute ":%s/__user__/" . $USER . "/eg"
    execute ":%s/__user_name__/" . "Yonatan Feldman" . "/eg"
    execute ":%s/__user_email__/" . $USER . "\@milliped.com" . "/eg"
    execute "normal " . "Gddgg"
  endif
"  let licensefile = $HOME . "/.vim/licenses/" . &filetype
"  if filereadable(licensefile)
"    execute ":0r " licensefile
"  endif
endfunction

" command to sort a range of lines; default range is the entire buffer
command! -range=% Sort <line1>,<line2>!sort

" function to do html quoting
function! QuoteHtmlFunction() range
  execute ":" . a:firstline . "," . a:lastline . "s/</\\\&lt;/eg"
  execute ":" . a:firstline . "," . a:lastline . "s/>/\\\&gt;/eg"
endfunction

" make QuoteHtml command to make this more natural
command! -range QuoteHtml <line1>,<line2>call QuoteHtmlFunction()
