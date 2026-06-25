var MCGA = MCGA || {};
MCGA.Core = MCGA.Core || {};

MCGA.Core.Modpacks = (function() {
    var STORAGE_KEY = 'mcga_modpacks';
    var DOWNLOAD_HISTORY_KEY = 'mcga_download_history';
    var API_BASE = 'https://api.modrinth.com/v2';

    var CATEGORIES = {
        tech: { name: '科技向', icon: '⚙️' },
        magic: { name: '魔法向', icon: '✨' },
        adventure: { name: '冒险向', icon: '🗺️' },
        hardcore: { name: '硬核向', icon: '💀' },
        lightweight: { name: '轻量优化', icon: '🚀' },
        kitchensink: { name: '万能厨房', icon: '🍳' }
    };

    function getFetchOptions() {
        return {
            method: 'GET',
            headers: {
                'User-Agent': 'MCGA-Pro/2.0.0 (https://github.com/Renualtrity/Software-project)'
            }
        };
    }

    function getCategories() {
        return CATEGORIES;
    }

    function buildFacets(projectType, filters) {
        var facets = [
            ["project_type:" + projectType]
        ];
        if (filters && filters.category) {
            facets.push(["categories:" + filters.category]);
        }
        if (filters && filters.loader) {
            facets.push(["loaders:" + filters.loader]);
        }
        if (filters && filters.mcVersion) {
            facets.push(["versions:" + filters.mcVersion]);
        }
        return encodeURIComponent(JSON.stringify(facets));
    }

    function convertModrinthHit(hit) {
        return {
            id: hit.project_id,
            name: hit.title,
            author: hit.author || '',
            version: hit.latest_version || '',
            mcVersion: hit.game_versions && hit.game_versions[0] ? hit.game_versions[0] : '',
            loader: hit.loaders && hit.loaders[0] ? hit.loaders[0] : 'forge',
            category: hit.categories && hit.categories[0] ? hit.categories[0] : 'kitchensink',
            downloads: hit.downloads || 0,
            rating: hit.follows ? Math.min(Math.round(hit.downloads / hit.follows * 2) / 2 + 3, 5) : 0,
            icon: hit.icon_url,
            description: hit.description || '',
            modCount: 0,
            tags: hit.categories || [],
            updatedAt: hit.date_modified ? hit.date_modified.split('T')[0] : '',
            createdAt: hit.date_created ? hit.date_created.split('T')[0] : '',
            pageUrl: hit.page_url,
            follows: hit.follows || 0
        };
    }

    function convertModrinthProject(project) {
        var authors = project.authors ? project.authors.map(function(a) { return a.name; }).join(', ') : '';
        return {
            id: project.id,
            name: project.title,
            author: authors,
            version: project.version || '',
            mcVersion: project.game_versions && project.game_versions.length > 0 ? project.game_versions[project.game_versions.length - 1] : '',
            loader: project.loaders && project.loaders[0] ? project.loaders[0] : 'forge',
            category: project.categories && project.categories[0] ? project.categories[0] : 'kitchensink',
            downloads: project.downloads || 0,
            rating: project.follows ? Math.min(Math.round(project.downloads / project.follows * 2) / 2 + 3, 5) : 0,
            icon: project.icon_url,
            description: project.description || '',
            body: project.body || '',
            modCount: 0,
            tags: project.categories || [],
            updatedAt: project.date_modified ? project.date_modified.split('T')[0] : '',
            createdAt: project.date_created ? project.date_created.split('T')[0] : '',
            pageUrl: 'https://modrinth.com/modpack/' + project.slug,
            follows: project.follows || 0,
            categories: project.categories || [],
            loaders: project.loaders || [],
            gameVersions: project.game_versions || []
        };
    }

    function searchModpacks(keyword, filters, offset, callback) {
        if (typeof offset === 'function') {
            callback = offset;
            offset = 0;
        }
        offset = offset || 0;

        var url = API_BASE + '/search?facets=' + buildFacets('modpack', filters);
        if (keyword) {
            url += '&query=' + encodeURIComponent(keyword);
        }
        url += '&limit=40&offset=' + offset + '&index=downloads';

        console.log('Modrinth Modpack Search URL:', url);

        fetch(url, getFetchOptions())
            .then(function(response) {
                if (!response.ok) {
                    throw new Error('API request failed (status: ' + response.status + ')');
                }
                return response.json();
            })
            .then(function(data) {
                var packs = (data.hits || []).map(convertModrinthHit);
                console.log('Found modpacks:', packs.length, '/ total:', data.total_hits);
                callback(null, packs, {
                    total: data.total_hits || 0,
                    offset: offset,
                    limit: 40
                });
            })
            .catch(function(error) {
                console.error('Modrinth API error:', error);
                callback(error, [], { total: 0, offset: offset, limit: 40 });
            });
    }

    function getModpackById(packId, callback) {
        fetch(API_BASE + '/project/' + packId, getFetchOptions())
            .then(function(response) {
                if (!response.ok) {
                    if (response.status === 404) {
                        return callback(null, null);
                    }
                    throw new Error('API request failed (status: ' + response.status + ')');
                }
                return response.json();
            })
            .then(function(project) {
                var pack = convertModrinthProject(project);
                loadVersionsForPack(pack, function(err) {
                    callback(err, pack);
                });
            })
            .catch(function(error) {
                console.error('Modrinth API error:', error);
                callback(error, null);
            });
    }

    function loadVersionsForPack(pack, callback) {
        fetch(API_BASE + '/project/' + pack.id + '/version', getFetchOptions())
            .then(function(response) {
                if (!response.ok) {
                    if (response.status === 404) {
                        pack.versions = [];
                        pack.latestVersion = null;
                        callback(null);
                        return;
                    }
                    throw new Error('API request failed (status: ' + response.status + ')');
                }
                return response.json();
            })
            .then(function(versions) {
                if (!versions || versions.length === 0) {
                    pack.versions = [];
                    pack.latestVersion = null;
                    callback(null);
                    return;
                }

                pack.versions = versions.slice(0, 5).map(function(v) {
                    return {
                        id: v.id,
                        name: v.name,
                        versionNumber: v.version_number,
                        gameVersions: v.game_versions || [],
                        loaders: v.loaders || [],
                        datePublished: v.date_published ? v.date_published.split('T')[0] : '',
                        files: v.files ? v.files.map(function(f) {
                            return {
                                id: f.id,
                                filename: f.filename,
                                url: f.url,
                                size: f.size || 0,
                                primary: f.primary || false
                            };
                        }) : [],
                        changelog: v.changelog || '',
                        dependencies: v.dependencies || []
                    };
                });

                if (pack.versions.length > 0) {
                    pack.latestVersion = pack.versions[0];
                }

                console.log('Loaded modpack versions:', pack.versions.length);
                callback(null);
            })
            .catch(function(error) {
                console.error('Modrinth API error:', error);
                pack.versions = [];
                pack.latestVersion = null;
                callback(null);
            });
    }

    function downloadModpack(packId, versionId, callback) {
        getModpackById(packId, function(err, pack) {
            if (err || !pack) {
                callback(err || new Error('Modpack not found'), null);
                return;
            }

            var versionToDownload = null;
            if (versionId && pack.versions) {
                versionToDownload = pack.versions.find(function(v) { return v.id === versionId; });
            } else {
                versionToDownload = pack.latestVersion;
            }

            if (!versionToDownload || !versionToDownload.files || versionToDownload.files.length === 0) {
                callback(new Error('No files found for download'), null);
                return;
            }

            var file = versionToDownload.files.find(function(f) { return f.primary; }) || versionToDownload.files[0];
            downloadFile(file.url, file.filename, callback);
        });
    }

    function downloadFile(url, filename, callback) {
        var proxyUrl = '/api/download?url=' + encodeURIComponent(url) + '&filename=' + encodeURIComponent(filename);
        
        console.log('Download URL:', proxyUrl);
        
        fetch(proxyUrl)
            .then(function(response) {
                if (!response.ok) throw new Error('Download failed (status: ' + response.status + ')');
                return response.blob();
            })
            .then(function(blob) {
                console.log('Downloaded blob size:', blob.size);
                
                var downloadUrl = window.URL.createObjectURL(blob);
                var a = document.createElement('a');
                a.href = downloadUrl;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(downloadUrl);

                var fileInfo = {
                    url: url,
                    filename: filename,
                    size: blob.size,
                    downloadedAt: Date.now()
                };
                callback(null, fileInfo);
            })
            .catch(function(error) {
                console.error('Download error:', error);
                callback(error, null);
            });
    }

    function installModpack(filePath) {
        var modpacks = getInstalledModpacks();
        var newPack = {
            id: 'local_' + Date.now(),
            name: filePath.split(/[\/\\]/).pop().replace(/\.(mrpack|zip)$/i, ''),
            author: '本地',
            version: '1.0.0',
            mcVersion: '未知',
            loader: 'forge',
            category: 'custom',
            downloads: 0,
            rating: 5,
            icon: '📦',
            description: '从本地导入的整合包',
            modCount: 0,
            tags: ['本地'],
            updatedAt: new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString().split('T')[0],
            pageUrl: '',
            isLocal: true,
            localPath: filePath
        };
        modpacks.push(newPack);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(modpacks));
        return newPack;
    }

    function uninstallModpack(packId) {
        var modpacks = getInstalledModpacks();
        modpacks = modpacks.filter(function(p) { return p.id !== packId; });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(modpacks));
        return true;
    }

    function isInstalled(packId) {
        var packs = getInstalledModpacks();
        return packs.some(function(p) { return p.id === packId; });
    }

    function getInstalledModpacks() {
        var data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    }

    function addDownloadHistory(pack) {
        var history = JSON.parse(localStorage.getItem(DOWNLOAD_HISTORY_KEY) || '[]');
        var exists = history.some(function(h) { return h.id === pack.id; });
        if (!exists) {
            history.unshift({
                id: pack.id,
                name: pack.name,
                type: 'modpack',
                downloadedAt: Date.now()
            });
            if (history.length > 50) history.pop();
            localStorage.setItem(DOWNLOAD_HISTORY_KEY, JSON.stringify(history));
        }
    }

    function formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
    }

    function formatDownloads(num) {
        if (num < 1000) return num;
        if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
        return (num / 1000000).toFixed(1) + 'M';
    }

    return {
        getCategories: getCategories,
        searchModpacks: searchModpacks,
        getModpackById: getModpackById,
        downloadModpack: downloadModpack,
        installModpack: installModpack,
        uninstallModpack: uninstallModpack,
        getInstalledModpacks: getInstalledModpacks,
        isInstalled: isInstalled,
        addDownloadHistory: addDownloadHistory,
        formatSize: formatSize,
        formatDownloads: formatDownloads
    };
})();