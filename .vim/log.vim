if has("autocmd")
  " when the file changes underneath us reload it
  autocmd! FileChangedShell             *.log     e!
  autocmd! CursorHold                   *.log     e!
  autocmd! FocusGained                  *.log     e!
endif
