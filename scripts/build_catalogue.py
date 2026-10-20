#!/usr/bin/env python3
"""Build a full public repo snapshot once per GitHub Actions run, not in visitors' browsers."""
import json, os, sys, urllib.request, urllib.error, datetime, concurrent.futures
from pathlib import Path
OWNER='DVExperiments'
TOKEN=os.environ.get('GH_TOKEN','')
ROOT=Path(__file__).resolve().parents[1]

def get(url):
    req=urllib.request.Request(url,headers={'Accept':'application/vnd.github+json','User-Agent':'DVExperiments-Catalogue/1.6.0',**({'Authorization':'Bearer '+TOKEN} if TOKEN else {})})
    with urllib.request.urlopen(req,timeout=20) as r: return json.load(r)

def metadata(repo):
    name=repo['name']; branch=repo.get('default_branch') or 'main'
    from urllib.parse import quote
    url=f'https://raw.githubusercontent.com/{OWNER}/{quote(name)}/{quote(branch)}/dv-project.json'
    try:
        with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'DVExperiments-Catalogue/1.6.0'}),timeout=12) as r:
            d=json.load(r)
            return d if isinstance(d,dict) else {}
    except (urllib.error.HTTPError, urllib.error.URLError, ValueError, TimeoutError): return {}

def build_one(repo):
    d=metadata(repo)
    if d.get('visible') is False: return None
    name=repo['name']; slug=''.join(c if c.isalnum() or c=='-' else '-' for c in name.lower().replace('_','-')).strip('-')
    description=d.get('description') or repo.get('description') or f'Public project in the DV Experiments collection: {name}.'
    homepage=repo.get('homepage') or ''
    pages=bool(repo.get('has_pages'))
    live=d.get('liveUrl') or (homepage if homepage.startswith('https://') else f'https://{OWNER.lower()}.github.io/{name}/')
    cover=d.get('cover','')
    if cover.startswith('https://'): image=cover
    elif isinstance(cover,str) and cover and not cover.startswith('/') and '..' not in cover:
        image=f'https://raw.githubusercontent.com/{OWNER}/{name}/{repo.get("default_branch") or "main"}/{cover}'
    else: image='assets/cover-default.svg'
    if name.lower()=='lumin': image='assets/lumin-cover.svg'
    return {'slug':slug,'title':d.get('title') or name.replace('-',' ').replace('_',' ').title(),
      'tagline':d.get('tagline') or description[:105], 'description':description,
      'category':d.get('category') or 'Experiments','platform':d.get('platform') or repo.get('language') or 'GitHub project',
      'year':str(d.get('year') or str(repo.get('created_at','2026'))[:4]), 'featured':bool(d.get('featured')),
      'embed':bool(d.get('embed')),'updatedAt':repo.get('pushed_at') or repo.get('updated_at') or '', 'image':image,'imageAlt':d.get('imageAlt') or f'Artwork for {name}',
      'overview':d.get('overview') if isinstance(d.get('overview'),list) else [description],
      'highlights':d.get('highlights') if isinstance(d.get('highlights'),list) else [],
      'tags':d.get('tags') if isinstance(d.get('tags'),list) else (repo.get('topics') or []),
      'status':'live' if pages else 'repository','liveUrl':live if pages else '',
      'repoUrl':repo.get('html_url') or f'https://github.com/{OWNER}/{name}',
      'notice':d.get('notice') or ('GitHub Pages is enabled.' if pages else 'Public repository; no Pages site detected.')}

def main():
    repos=[]
    for page in range(1,11):
        batch=get(f'https://api.github.com/users/{OWNER}/repos?per_page=100&page={page}&type=owner')
        if not isinstance(batch,list): raise RuntimeError('Invalid GitHub API response')
        repos.extend(batch)
        if len(batch)<100: break
    repos=[r for r in repos if r and r.get('name','').lower()!='dvexperiments.github.io' and not any(r.get(k) for k in ('private','fork','archived','disabled'))]
    if not repos: raise RuntimeError('GitHub returned no eligible repositories. Preserve previous catalogue.')
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool: entries=list(pool.map(build_one,repos))
    entries=[e for e in entries if e is not None]
    if not entries: raise RuntimeError('No visible projects; preserve previous catalogue.')
    entries.sort(key=lambda e:(not e['featured'], e['status']!='live',e['title'].lower()))
    destination=ROOT/'data/projects-catalogue.json'
    existing=json.loads(destination.read_text()) if destination.exists() else {}
    # Never let a partial API response shrink the last complete snapshot.
    known={e['repoUrl'].lower():e for e in existing.get('projects',[]) if e.get('repoUrl')}
    for e in entries: known[e['repoUrl'].lower()]=e
    output=list(known.values())
    output.sort(key=lambda e:(not e.get('featured'),e.get('status')!='live',e['title'].lower()))
    destination.write_text(json.dumps({'generatedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'projects':output},indent=2,ensure_ascii=False)+'\n')
    print(f'Saved {len(output)} projects ({len(entries)} found in this run)')

if __name__=='__main__': main()
