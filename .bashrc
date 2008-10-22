[ -n "${DEBUG}" ] && echo "... starting .bashrc";

# enabled
shopt -s cmdhist
shopt -s expand_aliases
shopt -s histappend
shopt -s histreedit
shopt -s hostcomplete
shopt -s huponexit
shopt -s interactive_comments
shopt -s lithist
shopt -s progcomp
shopt -s promptvars

# disabled
shopt -u cdable_vars
shopt -u cdspell
shopt -u checkhash
shopt -u checkwinsize
shopt -u dotglob
shopt -u execfail
shopt -u extglob
shopt -u histverify
shopt -u mailwarn
shopt -u no_empty_cmd_completion
shopt -u nocaseglob
shopt -u nullglob
shopt -u shift_verbose
shopt -u sourcepath
shopt -u xpg_echo

umask 002;
ulimit -c 0;

[ -r ${HOME}/.bash_environment ] && . ${HOME}/.bash_environment;
[ -r /opt/local/etc/bash_completion ] && . /opt/local/etc/bash_completion
[ -r /etc/shell-mods.sh ] && . /etc/shell-mods.sh;
[ -r ${HOME}/etc/shell-mods.sh ] && . ${HOME}/etc/shell-mods.sh;
[ -r ${HOME}/.aliases ] && . ${HOME}/.aliases;
[ -r ${HOME}/.functions ] && . ${HOME}/.functions;

[ -n "${DEBUG}" ] && echo "... ending .bashrc";

# vim:ft=sh:
