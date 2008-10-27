<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0"
    xmlns:xhtml="http://www.w3.org/1999/xhtml"
    xmlns:planet="http://planet.intertwingly.net/"
    xmlns:atom="http://www.w3.org/2005/Atom"
    xmlns="http://www.w3.org/2005/Atom"
    exclude-result-prefixes="xhtml atom">

    <!-- content always duplicates the title -->
    <xsl:template match="atom:content" />

    <!-- pass through everything else -->
    <xsl:template match="@*|node()">
        <xsl:copy>
            <xsl:apply-templates select="@*|node()"/>
        </xsl:copy>
    </xsl:template>

</xsl:stylesheet>
