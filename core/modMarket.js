var MCGA = MCGA || {};
MCGA.Core = MCGA.Core || {};

MCGA.Core.ModMarket = (function() {
    var STORAGE_KEY = 'mcga_downloaded_mods';
    var FAVORITE_KEY = 'mcga_favorite_mods';
    var DOWNLOAD_HISTORY_KEY = 'mcga_download_history';
    var API_BASE = 'https://api.modrinth.com/v2';

    var CATEGORIES = {
        technology: { name: '科技', icon: '⚙️' },
        magic: { name: '魔法', icon: '✨' },
        adventure: { name: '冒险', icon: '🗺️' },
        decoration: { name: '装饰', icon: '🎨' },
        utility: { name: '实用', icon: '🔧' },
        performance: { name: '性能', icon: '⚡' },
        library: { name: '库', icon: '📚' },
        worldgen: { name: '世界生成', icon: '🌍' },
        social: { name: '社交', icon: '👥' },
        gameplay: { name: '游戏玩法', icon: '🎮' }
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
            modId: hit.slug,
            modName: hit.title,
            author: hit.author || '',
            version: hit.latest_version || '',
            mcVersion: hit.game_versions && hit.game_versions[0] ? hit.game_versions[0] : '',
            loader: hit.loaders && hit.loaders[0] ? hit.loaders[0] : 'fabric',
            category: hit.categories && hit.categories[0] ? hit.categories[0] : 'utility',
            downloads: hit.downloads || 0,
            rating: hit.follows ? Math.min(Math.round(hit.downloads / hit.follows * 2) / 2 + 3, 5) : 0,
            icon: hit.icon_url,
            description: hit.description || '',
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
            modId: project.slug,
            modName: project.title,
            author: authors,
            version: project.version || '',
            mcVersion: project.game_versions && project.game_versions.length > 0 ? project.game_versions[project.game_versions.length - 1] : '',
            loader: project.loaders && project.loaders[0] ? project.loaders[0] : 'fabric',
            category: project.categories && project.categories[0] ? project.categories[0] : 'utility',
            downloads: project.downloads || 0,
            rating: project.follows ? Math.min(Math.round(project.downloads / project.follows * 2) / 2 + 3, 5) : 0,
            icon: project.icon_url,
            description: project.description || '',
            body: project.body || '',
            tags: project.categories || [],
            updatedAt: project.date_modified ? project.date_modified.split('T')[0] : '',
            createdAt: project.date_created ? project.date_created.split('T')[0] : '',
            pageUrl: 'https://modrinth.com/mod/' + project.slug,
            follows: project.follows || 0,
            categories: project.categories || [],
            loaders: project.loaders || [],
            gameVersions: project.game_versions || []
        };
    }

    function searchMods(keyword, filters, offset, callback) {
        if (typeof offset === 'function') {
            callback = offset;
            offset = 0;
        }
        offset = offset || 0;

        var url = API_BASE + '/search?facets=' + buildFacets('mod', filters);
        if (keyword) {
            url += '&query=' + encodeURIComponent(keyword);
        }
        url += '&limit=40&offset=' + offset + '&index=downloads';

        console.log('Modrinth Search URL:', url);

        fetch(url, getFetchOptions())
            .then(function(response) {
                if (!response.ok) {
                    throw new Error('API request failed (status: ' + response.status + ')');
                }
                return response.json();
            })
            .then(function(data) {
                var mods = (data.hits || []).map(convertModrinthHit);
                console.log('Found mods:', mods.length, '/ total:', data.total_hits);
                callback(null, mods, {
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

    function getModById(modId, callback) {
        fetch(API_BASE + '/project/' + modId, getFetchOptions())
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
                var mod = convertModrinthProject(project);
                loadVersionsForMod(mod, function(err) {
                    callback(err, mod);
                });
            })
            .catch(function(error) {
                console.error('Modrinth API error:', error);
                callback(error, null);
            });
    }

    function loadVersionsForMod(mod, callback) {
        fetch(API_BASE + '/project/' + mod.id + '/version', getFetchOptions())
            .then(function(response) {
                if (!response.ok) {
                    if (response.status === 404) {
                        mod.versions = [];
                        mod.latestVersion = null;
                        callback(null);
                        return;
                    }
                    throw new Error('API request failed (status: ' + response.status + ')');
                }
                return response.json();
            })
            .then(function(versions) {
                if (!versions || versions.length === 0) {
                    mod.versions = [];
                    mod.latestVersion = null;
                    callback(null);
                    return;
                }

                mod.versions = versions.slice(0, 5).map(function(v) {
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

                if (mod.versions.length > 0) {
                    mod.latestVersion = mod.versions[0];
                }

                console.log('Loaded versions:', mod.versions.length);
                callback(null);
            })
            .catch(function(error) {
                console.error('Modrinth API error:', error);
                mod.versions = [];
                mod.latestVersion = null;
                callback(null);
            });
    }

    function downloadMod(modId, versionId, callback) {
        getModById(modId, function(err, mod) {
            if (err || !mod) {
                callback(err || new Error('Mod not found'), null);
                return;
            }

            var versionToDownload = null;
            if (versionId && mod.versions) {
                versionToDownload = mod.versions.find(function(v) { return v.id === versionId; });
            } else {
                versionToDownload = mod.latestVersion;
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

    function getDownloadedMods() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        } catch (e) {
            return [];
        }
    }

    function isDownloaded(modId) {
        var mods = getDownloadedMods();
        return mods.some(function(m) { return m.id === modId; });
    }

    function recordDownload(mod) {
        var downloaded = getDownloadedMods();
        if (!downloaded.some(function(m) { return m.id === mod.id; })) {
            downloaded.push({
                id: mod.id,
                name: mod.modName || mod.name,
                author: mod.author,
                version: mod.latestVersion ? mod.latestVersion.versionNumber : '',
                downloadedAt: Date.now()
            });
            localStorage.setItem(STORAGE_KEY, JSON.stringify(downloaded));
        }
        addDownloadHistory(mod);
    }

    function getFavoriteMods() {
        try {
            return JSON.parse(localStorage.getItem(FAVORITE_KEY) || '[]');
        } catch (e) {
            return [];
        }
    }

    function isFavorite(modId) {
        var favs = getFavoriteMods();
        return favs.some(function(f) { return f.id === modId; });
    }

    function toggleFavorite(mod) {
        var favs = getFavoriteMods();
        var index = favs.findIndex(function(f) { return f.id === mod.id; });
        
        if (index >= 0) {
            favs.splice(index, 1);
            localStorage.setItem(FAVORITE_KEY, JSON.stringify(favs));
            return false;
        } else {
            favs.push({
                id: mod.id,
                name: mod.modName || mod.name,
                icon: mod.icon,
                addedAt: Date.now()
            });
            localStorage.setItem(FAVORITE_KEY, JSON.stringify(favs));
            return true;
        }
    }

    function addDownloadHistory(mod) {
        var history = JSON.parse(localStorage.getItem(DOWNLOAD_HISTORY_KEY) || '[]');
        var exists = history.some(function(h) { return h.id === mod.id; });
        if (!exists) {
            history.unshift({
                id: mod.id,
                name: mod.modName || mod.name,
                type: 'mod',
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
        searchMods: searchMods,
        getModById: getModById,
        downloadMod: downloadMod,
        getDownloadedMods: getDownloadedMods,
        isDownloaded: isDownloaded,
        recordDownload: recordDownload,
        getFavoriteMods: getFavoriteMods,
        isFavorite: isFavorite,
        toggleFavorite: toggleFavorite,
        addDownloadHistory: addDownloadHistory,
        formatSize: formatSize,
        formatDownloads: formatDownloads
    };
})();