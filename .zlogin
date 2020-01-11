[ -n "${DEBUG}" ] && echo ">>> `basename $0`";

# ssh key management
if [ -r ${HOME}/.ssh/id_rsa ]; then
    if [ `which keychain` ]; then
        # `which keychain` --agents ssh --inherit any --quiet id_rsa;
        `which keychain` --agents gpg --inherit any --quiet $GPG_KEY_ID;
    fi
fi

[ -d ${HOME}/.files ] && make -s;

[ -n "${DEBUG}" ] && echo "<<< `basename $0`";
