" -*- vim -*-
" FILE: "/home/joze/.vim/functions/Man.vim"
" LAST MODIFICATION: "Mon, 18 Dez 2000 14:07:12 +0100 (joze)"
" (C) 1999 - 2000 by Johannes Zellner, <johannes@zellner.org>
" $Id: //users/yon/.vim/Man.vim#1 $


" PURPOSE:
"   - view UNIX man pages in a split buffer
"   - includes syntax highlighting
"   - works also in gui (checked in gtk-gui)
"
" USAGE:
"   put this file in your ~/.vim/plugin
"
" NORMAL MODE:
"   place the cursor on a keyword, e.g. `sprintf' and
"   hit <Map>k. The window will get split and the man page
"   for sprintf will be displayed in the new window.
"   The <Map>k can be preceeded by a `count', e.g. typing
"   2<Map>k while the cursor is on the keyword `open' would
"   take you to `man 2 open'.
"
" COMMAND MODE:
"   The usage is like if you type it in your shell
"   (except, you've to use a capital `M').
"
"   :Man sprintf
"   :Man 2 open
"
" REQUIREMENTS:
"   man, col, vim version >= 600
"   `col' is used to remove control characters from the `man' output.
"   if `col' is not present on your system, you can set a global variable
"       let g:man_vim_only = 1
"   in your ~/.vimrc. If this variable is present vim filters away the
"   control characters from the man page itself.
"
" GLOBAL VARIABLES:
"   g:man_tmp_file         : name of the temporary file, which is used to
"                            display the man pages.
"   g:man_vim_only         : if present, `col' is not used
"   g:man_section_argument : string which preceedes the section number.
"                            This defaults to `-s' on solaris.
"   g:man_vertical_split   : if non-zero (which is the default) the screen
"                            is split vertically.
"
" CREDITS:
"   Adrian Nagle
"   John Spetz
"   Bram Moolenaar
"   Rajesh Kallingal
"   Antonio Colombo
"   Michael Sharpe
"
" LICENSE:
"   BSD type license: http://www.zellner.org/copyright.html
"   if you like this script type :help uganda<Enter>
"
" URL: http://www.zellner.org/vim/plugin/man.vim

if !exists("g:vimautoload")
    map <Leader>k :<c-u>call ManFancyCword(v:count)<cr>
    command! -nargs=* Man call ManPrePrep(<f-args>)
endif


" NOTE: if you're on solaris but don't want "-s" == g:man_section_argument
"       you should set g:man_section_argument to an empty value (or whatever
"       you need) before sourcing this file.
if $OSTYPE == "solaris" && !exists("g:man_section_argument")
    let g:man_section_argument="-s"
endif


if !exists("g:man_vertical_split")
    " split vertically by default for version >= 600, use
    "     :let g:man_vertical_split = 0
    " if you don't like this
    let g:man_vertical_split = 1
endif


au VimLeave * if filereadable('/_man.tmp') | call delete('/_man.tmp') | endif


fun! ManFancyCword(cnt)
    if a:cnt == 0
	if bufname("%") == '/_man.tmp'
	    let save_iskeyword = &iskeyword
	    set iskeyword+=(,)
	endif
	let page_section = expand("<cword>")
	if bufname("%") == '/_man.tmp'
	    let &iskeyword = save_iskeyword
	endif
	let page = substitute(page_section, '\(\k\+\).*', '\1', '')
	let section = substitute(page_section, '\(\k\+\)(\([^()]*\)).*', '\2', '')
	if -1 == match(section, '^[0-9 ]\+$')
	    let section = ""
	endif
	if section == page
	    let section = ""
	endif
    else
	let section = a:cnt
	let page = expand("<cword>")
    endif
    call ManPrep(section, page)
endfun

fun! ManPrePrep(...)
    if a:0 >= 2
	let section = a:1
	let page = a:2
    elseif a:0 >= 1
	let section = ""
	let page = a:1
    else
	return
    endif
    if "" == page
	return
    endif
    call ManPrep(section, page)
    " let i = 1 | while i <= a:0
    "     exe 'echo a:'.i
    " let i = i + 1 | endwhile
endfun

fun! ManPrep(section, page)
    if 0 == a:section || "" == a:section
	let section = ""
    elseif 9 == a:section
	let section = 0
    else
	let section = a:section
    endif

    let this_winnr = winnr()
    let old_report = &report
    let &report=999999999
    " why can't we open /dev/null ?
    "let tmp = "/dev/null"

    " check if a man window exists
    " and if so, go to it.
    let man_winnr = bufwinnr('/_man.tmp')
    if -1 != man_winnr
	" go to bottom window
	exe "normal \<c-w>b"
	let i = winnr()

	" go up through the windows until
	" we've reached the man window.
	while i != man_winnr && 1 <= i
	    exe "normal \<c-w>k"
	    let i = i - 1
	endwhile
	if 0 == i
	    " something went wrong
	    let &report=old_report
	    return ""
	endif
    else
	if 0 != g:man_vertical_split && v:version >= 600
	    vertical new /_man.tmp
	    setlocal foldmethod=
	else
	    new /_man.tmp
	    setlocal foldmethod=
	endif
	setlocal bufhidden=delete
    endif

    setlocal buftype=
    setlocal modifiable
    setlocal noreadonly
    %d _ " delete old manpage

    " Some platforms require an argument to specify the section number
    if exists("g:man_section_argument") && section != ""
	let section = g:man_section_argument.' '.section
    endif

    if exists("g:man_vim_only")
	0put=system('man '.section.' '.a:page)
	" col is not present. So we let vim filter away
	" the control characters. hope this works on
	" all systems.
	exe "%s/_\<c-h>\\(.\\)/\\1/ge"
	exe "%s/\\(.\\)\<c-h>\\(.\\)/\\1/ge"
    else
	" do we really need to redirect stderr ?
	" exe 'read !man '.section.' '.a:page.' | col -b 2>/dev/null'
	0put=system('man '.section.' '.a:page.' \| col -b')
    endif

    " go to start of manpage
    0
    " strip the blank lines from the top of the page
    " suggested by Michael Sharpe <msharpe@bmc.com>
    let firstLine = getline(1)
    while firstLine == ""
	:delete _
	let firstLine = getline(1)
    endwhile

    " write!

    setlocal nomod
    setlocal buftype=nowrite
    setlocal nomodifiable
    setlocal readonly
    setlocal ft=man

    " go back to `this'
    exe "normal ".this_winnr."\<c-w>W"
    let &report=old_report
endfun

" vim:set ts=8 sw=4:
