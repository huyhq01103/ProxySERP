#
# This script runs on "Attach" in Fiddler...
#
gsettings set org.gnome.system.proxy autoconfig-url 'http://localhost:8009/proxy.pac'
gsettings set org.gnome.system.proxy mode 'auto'
