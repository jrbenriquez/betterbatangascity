# Publish betterbatangascity.org

The repository is prepared for a custom-domain deployment at https://betterbatangascity.org. Hosting and HTTPS are free with GitHub Pages; domain registration is separate. The site remains an unofficial community portal.

## One-time setup

1. Register the domain if needed. In GitHub account settings → Pages, verify ownership of `betterbatangascity.org` using the TXT record GitHub provides. Keep that record in DNS.
2. In this repository, open Settings → Pages → Build and deployment, and select **GitHub Actions** as the source.
3. In Pages → Custom domain, enter `betterbatangascity.org` and save. The committed `CNAME` file also records the intended domain; an Actions deployment still needs this repository setting.
4. At the DNS provider, create the following records. Remove conflicting parking/forwarding records for the same names. Preserve email/MX/TXT records.

| Type  | Name | Value                 |
| ----- | ---- | --------------------- |
| A     | @    | 185.199.108.153       |
| A     | @    | 185.199.109.153       |
| A     | @    | 185.199.110.153       |
| A     | @    | 185.199.111.153       |
| CNAME | www  | jrbenriquez.github.io |

Do not point the domain to the repository URL or add a wildcard DNS record. IPv6 is optional; if existing AAAA records point elsewhere, remove or update them according to [GitHub's custom-domain documentation](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).

5. Merge the deployment configuration. After main's Lighthouse CI succeeds, **Deploy GitHub Pages** builds and uploads only `dist/`. You can also run it manually from Actions on `main`.
6. Wait for GitHub's DNS check and certificate provisioning, then enable **Enforce HTTPS**. Check both the apex domain and `www`, a nested service page, and `/404.html`. DNS/certificate changes can take time to propagate.

## Publishing and editing

After setup, successful main builds publish automatically. Failed validation and pull-request runs do not deploy. Shared templates render during the build; do not publish the source tree directly. The local news editor stays local: export JSON, commit the content change and merge it to publish.

GitHub Pages does not process `.htaccess`; Apache-specific headers and redirects in that file do not apply. The site uses actual HTML files and directory indexes and does not need Apache rewriting. GitHub supplies the custom 404 page.

This configuration does not register the domain, change DNS, verify ownership, or enable the repository's Pages setting. Those require the domain owner's and repository administrator's settings access.
