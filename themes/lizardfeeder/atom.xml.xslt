<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0"
    xmlns:access="http://www.bloglines.com/about/specs/fac-1.0"
    xmlns:atom="http://www.w3.org/2005/Atom"
    xmlns:planet="http://planet.intertwingly.net/"
    xmlns:xhtml="http://www.w3.org/1999/xhtml"
    xmlns:str="http://exslt.org/strings"
    xmlns:bz="http://www.bugzilla.org/rdf#" 
    xmlns="http://www.w3.org/2005/Atom"
    extension-element-prefixes="str"
    exclude-result-prefixes="planet xhtml atom">

    <xsl:template match="atom:link[@rel='self']">
        <link href="http://feeds.mozilla.com/archives/index.xml" rel="self" type="application/atom+xml"/>
    </xsl:template>
    
    <!-- Convert planet:tags and planet:short to atom:category -->
    <xsl:template match="atom:entry">
        <xsl:text>&#10;  </xsl:text>
        <xsl:copy>
            <xsl:apply-templates select="@*"/>

            <xsl:for-each select=".//planet:tags|.//planet:short|.//planet:group">
                <xsl:variable name="ele" select="." />
                <xsl:for-each select="str:tokenize(string(.), ' ')">
                    <xsl:variable name="term"   select="." />
                    <xsl:variable name="prefix">
                        <xsl:if test="not(local-name($ele) = 'tags')">
                            <xsl:value-of select="concat(local-name($ele), '=')" />
                        </xsl:if>
                    </xsl:variable> 
                    <xsl:text>&#10;    </xsl:text>
                    <category term="{$prefix}{$term}" />
                </xsl:for-each>
            </xsl:for-each>

            <xsl:apply-templates select="node()"/>
            <xsl:text>&#10;  </xsl:text>
        </xsl:copy>
    </xsl:template>

    <!-- tweak entry titles to reflect a bit about the entry source -->
    <!--
    <xsl:template match="atom:entry/atom:title">
        <xsl:variable name="short" select="..//planet:short/text()" />
        <xsl:variable name="group" select="..//planet:group/text()" />
        <xsl:text>&#10;    </xsl:text>
        <xsl:copy>
            <xsl:value-of select="concat('[', $group , ': ', $short, '] ', text())" />
        </xsl:copy>
    </xsl:template>
    -->

    <!-- strip bugzilla elements and attributes, since they confuse downstream processors -->
    <xsl:template match="bz:*|@bz:*"/>

    <!-- strip other planet elements and attributes -->
    <xsl:template match="planet:*|@planet:*"/>

    <!-- strip obsolete link relationships -->
    <xsl:template match="atom:link[@rel='service.edit']"/>
    <xsl:template match="atom:link[@rel='service.post']"/>
    <xsl:template match="atom:link[@rel='service.feed']"/>

    <!-- Feedburner detritus -->
    <xsl:template match="xhtml:div[@class='feedflare']"/>

    <!-- Strip site meter -->
    <xsl:template match="xhtml:div[comment()[. = ' Site Meter ']]"/>

    <!-- indent atom elements -->
    <xsl:template match="atom:*">
        <!-- double space before atom:entries -->
        <xsl:if test="self::atom:entry">
            <xsl:text>&#10;</xsl:text>
        </xsl:if>

        <!-- indent start tag -->
        <xsl:text>&#10;</xsl:text>
        <xsl:for-each select="ancestor::*">
            <xsl:text>  </xsl:text>
        </xsl:for-each>

        <xsl:copy>
            <xsl:apply-templates select="@*|node()"/>

            <!-- indent end tag if there are element children -->
            <xsl:if test="*">
                <xsl:text>&#10;</xsl:text>
                <xsl:for-each select="ancestor::*">
                    <xsl:text>  </xsl:text>
                </xsl:for-each>
            </xsl:if>
        </xsl:copy>
    </xsl:template>

    <!-- pass through everything else -->
    <xsl:template match="@*|node()">
        <xsl:copy>
            <xsl:apply-templates select="@*|node()"/>
        </xsl:copy>
    </xsl:template>

</xsl:stylesheet>
