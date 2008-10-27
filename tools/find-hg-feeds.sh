#!/bin/bash
###########################################################################
# Quick and dirty HG web scraper to generate config entries for HG feeds
#
# NOTE: This will probably kill your config file because this script is 
# broken and out of date, yet remains for future repair.
###########################################################################

BASE_URL="http://hg.mozilla.org";

start_ln=$( grep -ni '# hg feeds start' config.ini | cut -d: -f1 ); 
end_ln=$( grep -ni '# hg feeds end' config.ini | cut -d: -f1 );

head -n $start_ln config.ini > config.ini.new;

echo >> config.ini.new;

for bn in "" build incubator l10n-central labs users webtools www; do 
    url="$BASE_URL/$bn"; 
    for fu in $( curl -s $url | grep 'alt="Feed"' | cut -d'<' -f22- | cut -d'"' -f2 ); do 

        name_1=$( dirname $fu );
        name_2=${name_1:1};
        name=${name_2/\//_};
        short=$name;

        echo "[$BASE_URL$fu]" >> config.ini.new;
        echo "name    = Mercurial Activity for $fu" >> config.ini.new;
        echo "short   = $short" >> config.ini.new;
        echo "group   = code" >> config.ini.new;
        echo "tags    = hg" >> config.ini.new;
        echo "filters = ../../filters/hg-atom-log.xslt" >> config.ini.new;
        echo >> config.ini.new;

    done
done 

tail -n +$end_ln config.ini >> config.ini.new

mv config.ini config.ini.bak;
mv config.ini.new config.ini;
