<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0"
    xmlns:access="http://www.bloglines.com/about/specs/fac-1.0"
    xmlns:atom="http://www.w3.org/2005/Atom"
    xmlns:planet="http://planet.intertwingly.net/"
    xmlns:xhtml="http://www.w3.org/1999/xhtml"
    xmlns:date="http://exslt.org/dates-and-times"
    xmlns:str="http://exslt.org/strings"
    xmlns="http://www.w3.org/2005/Atom"
    extension-element-prefixes="str date"
    exclude-result-prefixes="planet xhtml atom">

    <xsl:variable name="start_time" select="//atom:entry[1]/atom:updated/text()" />
    <xsl:variable name="end_time"   select="date:add($start_time, '-PT6H')" />

    <xsl:template match="atom:entry">
        <xsl:variable name="entry_updated" select=".//atom:updated/text()" />
        <xsl:if test="starts-with(date:difference($entry_updated, $end_time), '-')">
            <xsl:text>&#10;  </xsl:text>
            <xsl:copy>
                <xsl:apply-templates select="@*"/>
                <xsl:apply-templates select="node()"/>
                <xsl:text>&#10;  </xsl:text>
            </xsl:copy>
        </xsl:if>
    </xsl:template>

    <!-- pass through everything else -->
    <xsl:template match="@*|node()">
        <xsl:copy>
            <xsl:apply-templates select="@*|node()"/>
        </xsl:copy>
    </xsl:template>

</xsl:stylesheet>
