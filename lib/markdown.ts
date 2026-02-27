import fs from 'fs';
import path from 'path';

export interface CaseStudy {
    slug: string;
    title: string;
    date: string;
    client: string;
    category: string;
    image: string;
    description: string;
    challenge: string;
    solution: string;
    results: string;
    content: string;
}

const caseStudiesDirectory = path.join(process.cwd(), 'content/case-studies');

export function getAllCaseStudies(): CaseStudy[] {
    if (!fs.existsSync(caseStudiesDirectory)) return [];

    const fileNames = fs.readdirSync(caseStudiesDirectory);
    const allPostsData = fileNames.map((fileName) => {
        const slug = fileName.replace(/\.md$/, '');
        const fullPath = path.join(caseStudiesDirectory, fileName);
        const fileContents = fs.readFileSync(fullPath, 'utf8');

        // Simple frontmatter parser
        const match = fileContents.match(/^---\n([\s\S]+?)\n---\n([\s\S]*)$/);
        if (!match) return null;

        const [, frontmatter, content] = match;
        const data: any = {};

        frontmatter.split('\n').forEach(line => {
            const [key, ...value] = line.split(':');
            if (key && value) {
                data[key.trim()] = value.join(':').trim().replace(/^"(.*)"$/, '$1');
            }
        });

        return {
            slug,
            content,
            ...data
        } as CaseStudy;
    }).filter(post => post !== null) as CaseStudy[];

    return allPostsData.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getCaseStudyBySlug(slug: string): CaseStudy | null {
    try {
        const fullPath = path.join(caseStudiesDirectory, `${slug}.md`);
        const fileContents = fs.readFileSync(fullPath, 'utf8');
        const match = fileContents.match(/^---\n([\s\S]+?)\n---\n([\s\S]*)$/);
        if (!match) return null;

        const [, frontmatter, content] = match;
        const data: any = {};

        frontmatter.split('\n').forEach(line => {
            const [key, ...value] = line.split(':');
            if (key && value) {
                data[key.trim()] = value.join(':').trim().replace(/^"(.*)"$/, '$1');
            }
        });

        return {
            slug,
            content,
            ...data
        } as CaseStudy;
    } catch (e) {
        return null;
    }
}
