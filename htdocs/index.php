<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
"http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en-US" lang="en-US" dir="ltr">

    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
        <title>LizardFeeder | Mozilla</title>

        <link rel="shortcut icon" href="http://www.mozilla.com/favicon.ico" type="image/x-icon" />
        <link rel="alternate" type="application/atom+xml" title="Atom archives" href="archives/index.xml" />
        <link rel="outline" type="text/xml+opml" title="Feeds" href="sources.opml" />

        <link rel="stylesheet" type="text/css" href="http://www.mozilla.com/includes/yui/2.5.1/reset-fonts-grids/reset-fonts-grids.css" />
        <link rel="stylesheet" type="text/css" href="http://www.mozilla.com/style/tignish/template.css" media="screen" />
        <link rel="stylesheet" type="text/css" href="http://www.mozilla.com/style/tignish/content.css" media="screen" />

        <link rel="stylesheet" type="text/css" href="css/mozilla-lizardfeeder.css" media="screen" />

        <script src="js/sugar-arrays-min.js" type="text/javascript">/**/</script>
        <script src="js/jquery-1.2.6.min.js" type="text/javascript">/**/</script>
        <script src="js/jquery-ui-personalized-1.6rc2.min.js" type="text/javascript">/**/</script>
        <script src="js/jquery.timeago.js" type="text/javascript">/**/</script>
        <script src="js/strftime.js" type="text/javascript">/**/</script>
        <script src="js/lmo-utils.js" type="text/javascript">/**/</script>
        <script src="js/lizardfeeder/feeder.js" type="text/javascript">/**/</script>
        <script src="js/lizardfeeder/timecontrol.js" type="text/javascript">/**/</script>
        <script src="js/lizardfeeder/main.js" type="text/javascript">/**/</script>
    </head>

    <body id="whats-happening" class="">
        <h4 id="moz"><a accesskey="1" title="mozilla.com" href="http://www.mozilla.com/en-US/"><img width="89" height="38" title="Mozilla Corporation" alt="Mozilla Corporation" src="http://addons.mozilla.org/img/template/moz-com-logo.png"/></a></h4>
        <div id="wrapper">
            <div id="doc3">
                <div id="nav-access">
                    <a href="#nav-main">skip to navigation</a>
                    <a href="#switch">switch language</a>
                </div>
                <div id="content">

                    <div id="intro" class="windowshade">

                        <div class="panes">

                            <div id="intro-about" class="pane selected">
                                <h1>Welcome to the LizardFeeder</h1>
                                <p>
                                   The Lizard Feeder is a compilation of data
                                   feeds representing activity within the
                                   Mozilla community. If you have suggestions
                                   for things we've missed, <a href="https://bugzilla.mozilla.org/show_bug.cgi?id=469838">let us know</a>. 
                                </p>

                                <p>
                                    You can click on one of the bars in the 
                                    activity graph below to start the feed at a 
                                    particular point in time:
                                </p>
                                <ul id="date-nav">
                                    <li class="year template">
                                        <div class="year-meta">
                                            <a class="year-label">200X</a>
                                            <span class="year-total">##</span>
                                        </div>
                                        <ul class="months">
                                            <li class="month template">
                                                <div class="month-meta">
                                                    <a class="month-label">MM</a>
                                                    <span class="month-total">##</span>
                                                </div>
                                                <ul class="days">
                                                    <li class="day template">
                                                        <a class="day-meta">
                                                            <span class="day-label">MM</span>
                                                            <span class="day-total">##</span>
                                                        </a>
                                                    </li>
                                                </ul>
                                            </li>
                                        </ul>
                                    </li>
                                </ul>

                                <p>
                                    You can also control the playback speed of 
                                    the feed with the following slider:
                                </p>

                                <div id="speed-control">
                                    <div class="ui-slider-handle"></div>
                                    <ul class="scale"><li class="template"></li></ul>
                                </div>

                                <p>
                                    Finally, you can hide this panel with the 
                                    button on the lower right.
                                </p>

                            </div>

                        </div>

                        <ul class="nav">
                            <li class="selected"><a href="#intro-about">About / Options</a></li>
                            <li><div class="status">
                                <p>Feed time (<span id="speed-factor">1</span>x): <span id="last-time">...</span></p>
                            </div></li>
                            <li class="hide"><a href="#intro-hide">x Hide</a></li>
                        </ul>

                    </div>

                    <?php echo file_get_contents('entries.html') ?>
                </div><!-- end #content div -->

                <div id="footer-divider"><hr /></div>

            </div><!-- end #doc -->
        </div><!-- end #wrapper -->

        <?php echo file_get_contents('sources.html') ?>

        <!-- start #footer -->
        <div id="footer">
            <div id="footer-contents">

                <ul id="footer-menu">
                    <li><a href="http://www.mozilla.com/en-US/firefox/">Firefox</a>
                    <ul>
                        <li><a href="http://www.mozilla.com/en-US/firefox/features/">Features</a></li>
                        <li><a href="http://www.mozilla.com/en-US/firefox/security/">Security</a></li>
                        <li><a href="http://www.mozilla.com/en-US/firefox/customize/">Customization</a></li>
                        <li><a href="http://www.mozilla.com/en-US/firefox/organic/">100% Organic Software</a></li>
                        <li><a href="http://www.mozilla.com/en-US/firefox/tips/">Tips and Tricks</a></li>
                        <li><a href="http://www.mozilla.com/en-US/firefox/3.0.3/releasenotes/">Release Notes</a></li>
                        <li><a href="http://www.mozilla.com/en-US/firefox/all.html">Other Systems and Languages</a></li>
                    </ul>
                    </li>
                    <li><a href="https://addons.mozilla.org/" class="external">Add-ons</a>
                    <ul>
                        <li><a href="https://addons.mozilla.org/firefox/" class="external">All Add-ons</a></li>
                        <li><a href="https://addons.mozilla.org/firefox/recommended" class="external">Recommended</a></li>
                        <li><a href="https://addons.mozilla.org/firefox/browse/type:1/cat:all?sort=popular" class="external">Popular</a></li>
                        <li><a href="https://addons.mozilla.org/firefox/browse/type:2" class="external">Themes</a></li>
                        <li><a href="https://addons.mozilla.org/firefox/browse/type:4" class="external">Search Engines</a></li>
                        <li><a href="https://addons.mozilla.org/firefox/browse/type:7" class="external">Plugins</a></li>
                    </ul>
                    </li>
                    <li><a href="http://support.mozilla.com/">Support</a>
                    <ul>
                        <li><a href="http://support.mozilla.com/en-US/kb/">Firefox Support</a></li>
                        <li><a href="http://www.mozilla.org/support/thunderbird/" class="external">Thunderbird Support</a></li>
                    </ul>
                    </li>
                    <li><a href="http://www.mozilla.com/en-US/manyfaces/">Community</a>
                    <ul>
                        <li><a href="https://addons.mozilla.org/" class="external">Add-ons</a></li>
                        <li><a href="https://bugzilla.mozilla.org/" class="external">Bugzilla</a></li>
                        <li><a href="http://developer.mozilla.org/" class="external">Mozilla Developer Center</a></li>
                        <li><a href="http://labs.mozilla.com/" class="external">Mozilla Labs</a></li>
                        <li><a href="http://www.mozillamessaging.com/" class="external">Mozilla Messaging</a></li>
                        <li><a href="http://www.mozilla.org/" class="external">Mozilla.org</a></li>
                        <li><a href="http://www.mozillazine.org/" class="external">MozillaZine</a></li>
                        <li><a href="http://planet.mozilla.org/" class="external">Planet Mozilla</a></li>
                        <li><a href="http://quality.mozilla.org/" class="external">QMO</a></li>
                        <li><a href="http://www.spreadfirefox.com/" class="external">SpreadFirefox</a></li>
                        <li><a href="http://support.mozilla.com/">Support</a></li>
                    </ul>
                    </li>
                    <li><a href="http://www.mozilla.com/en-US/about/">About</a>
                    <ul>
                        <li><a href="http://www.mozilla.com/en-US/about/whatismozilla.html">What is Mozilla?</a></li>
                        <li><a href="http://www.mozilla.com/en-US/about/get-involved.html">Get Involved</a></li>
                        <li><a href="http://www.mozilla.com/en-US/press/">Press Center</a></li>
                        <li><a href="http://www.mozilla.com/en-US/about/careers.html">Careers</a></li>
                        <li><a href="http://www.mozilla.com/en-US/about/partnerships.html">Partnerships</a></li>
                        <li><a href="http://www.mozilla.org/foundation/licensing.html" class="external">Licensing</a></li>
                        <li><a href="http://blog.mozilla.com/" class="external">Blog</a></li>
                        <li><a href="http://store.mozilla.org/" class="external">Store</a></li>
                        <li><a href="http://www.mozilla.com/en-US/about/logo/">Logo Guide (beta)</a></li>
                        <li><a href="http://www.mozilla.com/en-US/about/contact.html">Contact Us</a></li>
                    </ul>
                    </li>
                </ul>

                <div id="copyright">
                    <p><strong>Copyright &#169; 2005&#8211;2009 Mozilla.</strong> All rights reserved.</p>
                    <p id="footer-links"><a href="http://www.mozilla.com/en-US/privacy-policy.html">Privacy Policy</a> &nbsp;|&nbsp; 
                    <a href="http://www.mozilla.com/en-US/about/legal.html">Legal Notices</a></p>
                </div>

            </div>
        </div>
        <!-- end #footer -->

        <script type="text/javascript" src="js/__utm.js"></script>
    </body>
</html>
