import 'dotenv/config';
import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: "Claude's Cookbook",
  tagline: 'Tried and true, sure would do',
  favicon: 'img/favicon.svg',
  customFields: {
    GREAT_SUCCESS: process.env.GREAT_SUCCESS,
  },
  plugins: [
    [
      '@docusaurus/plugin-content-blog',
      {
        /**
         * Required for any multi-instance plugin
         */
        id: 'suggestions',
        /**
         * URL route for the blog section of your site.
         * *DO NOT* include a trailing slash.
         */
        routeBasePath: 'suggestions',
        /**
         * Path to data on filesystem relative to site dir.
         */
        path: './suggestions',
        blogTitle: 'Recipe Suggestions',
        blogDescription: 'Community-submitted recipes awaiting review',
        showReadingTime: true,
        blogSidebarTitle: 'All Suggestions',
        blogSidebarCount: 'ALL',
        editUrl: 'https://github.com/galvanized-solutions/cookbook/tree/main/',
        feedOptions: {
          type: ['rss', 'atom'],
          xslt: true,
          title: "Recipe Suggestions - Claude's Cookbook",
          description: 'Latest recipe suggestions awaiting review'
        },
      },
    ],
  ],

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://galvanized-solutions.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/cookbook/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'galvanized-solutions', // Usually your GitHub org/user name.
  projectName: 'cookbook', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  presets: [
    [
      'classic',
      {
        docs: false, // Disable docs
        blog: {
          path: './recipes',
          routeBasePath: '/recipes',
          blogTitle: 'Recipes',
          blogDescription: 'Delicious recipes tried and tested',
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
            title: "Claude's Recipes",
            description: 'Latest recipes from our cookbook'
          },
          editUrl:
            'https://github.com/galvanized-solutions/cookbook/tree/main/',
          blogSidebarTitle: 'All Tried & True',
          blogSidebarCount: 'ALL',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    navbar: {
      title: "Claude's Cookbook",
      logo: {
        alt: 'Cook Book Logo',
        src: 'img/favicon.svg',
      },
      items: [
        { to: '/recipes', label: 'Recipes', position: 'left' },
        { to: '/suggestions', label: 'Suggestions', position: 'left' },
        {
          href: 'https://github.com/galvanized-solutions/cookbook/issues',
          label: 'Recipe Requests',
          position: 'right',
        },
        {
          href: 'https://docs.anthropic.com/en/home',
          label: 'Claude AI',
          position: 'right',
        },
        {
          href: 'https://github.com/galvanized-solutions/cookbook',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      copyright: `Copyright © ${new Date().getFullYear()} Galvanized Solutions, Inc.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
