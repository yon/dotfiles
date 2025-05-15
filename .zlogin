[ -n "${DEBUG}" ] && echo ">>> `basename $0`";

# ssh key management
if [ -r ${HOME}/.gnupg/private-keys-v1.d/ ]; then
    if [ `which keychain` ]; then
        `which keychain` --ssh-spawn-gpg --quiet $GPG_KEY_ID;
    fi
fi

[ -d ${HOME}/.files ] && make -s;

[ -n "${DEBUG}" ] && echo "<<< `basename $0`";
