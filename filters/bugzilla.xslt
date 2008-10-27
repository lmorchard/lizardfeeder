<!--
    Feed filter to sprinkle in some bugzilla-specific categories and XML data
-->
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0"
    xmlns:xhtml="http://www.w3.org/1999/xhtml"
    xmlns:planet="http://planet.intertwingly.net/"
    xmlns:atom="http://www.w3.org/2005/Atom"
    xmlns="http://www.w3.org/2005/Atom"
    exclude-result-prefixes="xhtml atom">

    <!-- scrape the bug number from the title -->
    <xsl:template match="atom:entry/atom:title">
        <xsl:variable name="number" select="substring-before(substring-after(string(), '[Bug '), ']')" />
        <xsl:copy>
            <xsl:apply-templates select="@*|node()"/>
        </xsl:copy>
        <category term="bugzilla:id={$number}" />
    </xsl:template>

    <xsl:template match="atom:summary">

        <!-- change just some select summary fields into categories -->
        <xsl:for-each select=".//xhtml:tr[contains(@class, 'bz_feed_')]">
            <xsl:variable name="name"  select="substring-after(@class, 'bz_feed_')" />
            <xsl:variable name="value" select="./xhtml:td[2]/text()" />
            <xsl:if test="$value and not( $value = '--' ) and 
                ( $name='product' or $name='component' or $name='bug_status' 
                    or $name='resolution' or $name='priority' or $name='severity' 
                    or $name='target_milestone')">
                <category term="bugzilla:{$name}={$value}" />
            </xsl:if>
        </xsl:for-each>

        <!-- convert the whole XHTML summary into a custom bug record -->
        <!--
        <xsl:text>&#10;    </xsl:text>
        <bug xmlns="http://www.bugzilla.org/rdf#">
            <xsl:attribute name="href">
                <xsl:value-of select="concat('https://bugzilla.mozilla.org/show_bug.cgi?id=', substring-before(substring-after(../atom:title/text(), '[Bug '), ']'))" />
            </xsl:attribute>
            <xsl:for-each select=".//xhtml:tr[contains(@class, 'bz_feed_')]">
                <xsl:text>&#10;      </xsl:text>
                <xsl:element name="{substring-after(@class, 'bz_feed_')}">
                    <xsl:value-of select="./xhtml:td[2]/text()" />
                </xsl:element>
            </xsl:for-each>
            <xsl:text>&#10;    </xsl:text>
        </bug>
        -->

        <xsl:copy>
            <xsl:apply-templates select="@*|node()"/>
        </xsl:copy>

    </xsl:template>

    <!-- pass through everything else -->
    <xsl:template match="@*|node()">
        <xsl:copy>
            <xsl:apply-templates select="@*|node()"/>
        </xsl:copy>
    </xsl:template>

</xsl:stylesheet>
