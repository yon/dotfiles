;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Common environment variable settings
(setenv "PAGER" "cat")
(setenv "CVS_RSH" "ssh")

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; General Emacs Preferences
(add-hook 'comint-output-filter-functions 'comint-watch-for-password-prompt)
(add-hook 'find-file-hooks 'turn-on-font-lock)
(add-hook 'write-file-hooks 'delete-trailing-whitespace)
(column-number-mode t)
(cond (window-system (mwheel-install)))
(global-font-lock-mode t)
(global-set-key [?\C-h] 'delete-backward-char)
(global-set-key [(control x) (control r)] 'rename-buffer) 
(global-set-key [delete] 'delete--backward-char)
(global-set-key [kp-delete] 'delete-char)
(line-number-mode t)
(menu-bar-mode 'nil)
(put 'narrow-to-region 'disabled nil)
(set-variable 'frame-title-format '(multiple-frames "%b" ("" system-name ":" invocation-name)))
(set-variable 'icon-title-format '(multiple-frames "%b" ("" system-name ":" invocation-name)))
(setq inhibit-startup-message t)
(setq load-path (cons "~/.emacscode" load-path))
(setq make-backup-files nil)
(setq next-line-add-newlines nil)
(setq-default auto-save-default nil)
(setq-default backup-inhibited t)
(setq-default indent-tabs-mode nil)
(setq-default make-backup-files nil)
(setq-default next-line-add-newlines nil)
(setq-default scroll-step 1)
(setq-default tab-width 8)
(setq-default transient-mark-mode t)

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Load machine-specific elisp file
(load-file "~/.emacs-local.el")
