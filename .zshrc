[ -n "${DEBUG}" ] && echo ">>> `basename $0`";

[ -r ${HOME}/.env ] && . ${HOME}/.env;

# misc
umask 0077;
ulimit -c 0;

# make zle (zsh line editor) behave like emacs
bindkey -e

# cd/pushd/popd
setopt auto_pushd
setopt pushd_ignore_dups
setopt pushd_silent

# history
setopt append_history
setopt extended_history
setopt hist_expire_dups_first
setopt hist_find_no_dups
setopt hist_ignore_dups
setopt hist_reduce_blanks
setopt inc_append_history
setopt share_history

# prompt
PROMPT=""
if [ -n "${SSH_CLIENT}" ]; then
    PROMPT+="%m:";
fi
PROMPT+="%F{240}%~%f %# ";

# rprompt (git)
autoload -Uz vcs_info
precmd_vcs_info() { vcs_info }
precmd_functions+=( precmd_vcs_info )
setopt prompt_subst
zstyle ':vcs_info:*' check-for-changes true
zstyle ':vcs_info:*' stagedstr '+'
zstyle ':vcs_info:*' unstagedstr '!'
zstyle ':vcs_info:*' formats '%F{240}%r (%b%u%c)%f'
zstyle ':vcs_info:*' enable git
RPROMPT=\$vcs_info_msg_0_

# completion
setopt glob_dots
zstyle ':completion:*:*:make:*' tag-order 'targets'
autoload -U compinit && compinit

[ -r ${HOME}/.aliases ] && . ${HOME}/.aliases;
[ -r ${HOME}/.functions ] && . ${HOME}/.functions;

[ -n "${DEBUG}" ] && echo "<<< `basename $0`";
