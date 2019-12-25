[ -n "${DEBUG}" ] && echo "... starting .zshrc";

[ -r ${HOME}/.env ] && . ${HOME}/.env;

# cd/pushd/popd options
setopt -o autopushd
setopt -o pushdignoredups
setopt -o pushdsilent

# history options
setopt -o appendhistory
setopt -o extendedhistory
setopt -o histexpiredupsfirst
setopt -o histfindnodups
setopt -o histignoredups
setopt -o histreduceblanks
setopt -o incappendhistory
setopt -o sharehistory

# make zle (zsh line editor) behave like emacs
bindkey -e

umask 0022;
ulimit -c 0;

# prompt
PROMPT=""
if [ -n "${SSH_CLIENT}" ]; then
    PROMPT+="%m:";
fi
PROMPT+="%F{240}%~%f %# ";

# git rprompt
autoload -Uz vcs_info
precmd_vcs_info() { vcs_info }
precmd_functions+=( precmd_vcs_info )
setopt prompt_subst
RPROMPT=\$vcs_info_msg_0_
zstyle ':vcs_info:git:*' formats '%F{240}%r (%b)%f'
zstyle ':vcs_info:*' enable git

# completion
zstyle ':completion:*:*:make:*' tag-order 'targets'
autoload -U compinit && compinit

[ -r ${HOME}/.aliases ] && . ${HOME}/.aliases;
[ -r ${HOME}/.functions ] && . ${HOME}/.functions;

[ -n "${DEBUG}" ] && echo "... ending .zshrc";
