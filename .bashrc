[ -n "${DEBUG}" ] && echo ">>> `basename $0`";

[ -r /etc/bashrc ] && . /etc/bashrc;

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

umask 0022;
ulimit -c 0;

[ -r ${HOME}/.bash_environment ] && . ${HOME}/.bash_environment;
[ -r ${HOME}/.bash_completion ] && . ${HOME}/.bash_completion;
[ -r ${HOME}/.aliases ] && . ${HOME}/.aliases;
[ -r ${HOME}/.functions ] && . ${HOME}/.functions;

[ -n "${DEBUG}" ] && echo "<<< `basename $0`";
