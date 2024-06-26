[ -n "${DEBUG}" ] && echo ">>> `basename $0`";

[ -r ${HOME}/.env ] && . ${HOME}/.env;

# misc
umask 077;
ulimit -c 0;

# make zle (zsh line editor) behave like emacs
bindkey -e

my-backward-delete-word () {
    #local WORDCHARS=${WORDCHARS/\/}
    local WORDCHARS=''
    zle backward-delete-word
}
zle -N my-backward-delete-word
bindkey '\e^?' my-backward-delete-word

# cd/pushd/popd
setopt auto_pushd
setopt pushd_ignore_dups
setopt pushd_silent

# history
setopt hist_expire_dups_first
setopt hist_find_no_dups
setopt hist_ignore_dups
setopt hist_reduce_blanks
setopt inc_append_history

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

# if [ -r /opt/homebrew/Caskroom/google-cloud-sdk/latest/google-cloud-sdk/completion.zsh.inc ]; then
#     . /opt/homebrew/Caskroom/google-cloud-sdk/latest/google-cloud-sdk/completion.zsh.inc;
# fi

if [ -r ${HOME}/.nix-profile/etc/profile.d/nix.sh ]; then . ${HOME}/.nix-profile/etc/profile.d/nix.sh; fi # added by Nix installer

[ -x ${HOME}/.nix-profile/bin/direnv ] && eval "$(direnv hook zsh)";

# if [ -r ${HOME}/src/github.com/spwhitt/nix-zsh-completions/nix-zsh-completions.plugin.zsh ]; then
#     source ${HOME}/src/github.com/spwhitt/nix-zsh-completions/nix-zsh-completions.plugin.zsh
#     fpath=(${HOME}/nix-zsh-completions $fpath)
# fi

autoload -U compinit && compinit -d /dev/null

[ -r ${HOME}/.aliases ] && . ${HOME}/.aliases;
[ -r ${HOME}/.functions ] && . ${HOME}/.functions;

[ -n "${DEBUG}" ] && echo "<<< `basename $0`";
