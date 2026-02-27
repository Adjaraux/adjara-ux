"use client";

export default function StructuredData() {
    const schema = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Organization",
                "@id": "https://adjara-ux.com/#organization",
                "name": "Adjara UX",
                "url": "https://adjara-ux.com",
                "logo": {
                    "@type": "ImageObject",
                    "url": "https://adjara-ux.com/logo.png"
                },
                "description": "Premium Digital Agency & Academy specializing in UI/UX Design, Development and AI.",
                "sameAs": [
                    "https://linkedin.com/company/adjara-ux",
                    "https://twitter.com/adjara_ux"
                ]
            },
            {
                "@type": "WebSite",
                "@id": "https://adjara-ux.com/#website",
                "url": "https://adjara-ux.com",
                "name": "Adjara UX",
                "publisher": { "@id": "https://adjara-ux.com/#organization" }
            },
            {
                "@type": "Service",
                "name": "Expertise en Design UI/UX",
                "provider": { "@id": "https://adjara-ux.com/#organization" },
                "description": "Services de design stratégique pour produits digitaux premium en Afrique.",
                "areaServed": "Africa",
                "image": "https://adjara-ux.com/agency-preview.png",
                "offers": {
                    "@type": "Offer",
                    "priceCurrency": "XOF",
                    "availability": "https://schema.org/InStock"
                }
            },
            {
                "@type": "Course",
                "@id": "https://adjara-ux.com/#course-uiux",
                "name": "Masterclass Design UI/UX Premium",
                "description": "Formation d'élite pour devenir expert en design d'interface et d'expérience utilisateur.",
                "provider": { "@id": "https://adjara-ux.com/#organization" },
                "hasCourseInstance": {
                    "@type": "CourseInstance",
                    "courseMode": "online",
                    "instructor": {
                        "@type": "Person",
                        "name": "Experts Adjara UX"
                    }
                }
            },
            {
                "@type": "EducationalOrganization",
                "name": "Adjara Academy",
                "parentOrganization": { "@id": "https://adjara-ux.com/#organization" },
                "description": "Accélérateur de carrière élitiste pour les métiers de la tech en Afrique.",
                "offers": {
                    "@type": "Offer",
                    "category": "Technology Education"
                }
            }
        ]
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}
