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

# completion optimizations
setopt glob_dots
setopt complete_in_word
setopt auto_menu
setopt auto_list

# Modern completion styling
zstyle ':completion:*' menu select
zstyle ':completion:*' group-name ''
zstyle ':completion:*:descriptions' format '%F{yellow}-- %d --%f'
zstyle ':completion:*:warnings' format '%F{red}No matches for:%f %d'
zstyle ':completion:*' matcher-list 'm:{a-zA-Z}={A-Za-z}' 'r:|=*' 'l:|=* r:|=*'
zstyle ':completion:*:*:make:*' tag-order 'targets'

# Cache completions for better performance
zstyle ':completion:*' use-cache on
zstyle ':completion:*' cache-path ~/.zsh/cache

# Lazy load heavy tools to improve startup time
direnv() {
    unfunction "$0"
    if command -v direnv >/dev/null 2>&1; then
        eval "$(command direnv hook zsh)"
        direnv "$@"
    else
        echo "direnv not found" >&2
        return 1
    fi
}

mise() {
    unfunction "$0"
    if command -v mise >/dev/null 2>&1; then
        eval "$(command mise activate zsh)"
        mise "$@"
    else
        echo "mise not found" >&2
        return 1
    fi
}

if [ -f '/opt/homebrew/share/google-cloud-sdk/completion.zsh.inc' ]; then . '/opt/homebrew/share/google-cloud-sdk/completion.zsh.inc'; fi

# Initialize completions
autoload -Uz compinit
# Rebuild completions if dump file is corrupted
if [[ ! -f ~/.zcompdump ]] || ! zcompile -t ~/.zcompdump 2>/dev/null; then
    compinit
else
    compinit -C
fi

[ -r ${HOME}/.aliases ] && . ${HOME}/.aliases;
[ -r ${HOME}/.functions ] && . ${HOME}/.functions;

[ -n "${DEBUG}" ] && echo "<<< `basename $0`";
