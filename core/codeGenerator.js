var MCGA = MCGA || {};
MCGA.Core = MCGA.Core || {};

MCGA.Core.CodeGenerator = (function() {
    var PACKAGE_BASE = null;

    function generateModProject(modData, callback) {
        try {
            PACKAGE_BASE = 'com.' + modData.modId;
            var files = {};
            var structure = {};

            addFile(files, 'build.gradle', generateBuildGradle(modData));
            addFile(files, 'settings.gradle', generateSettingsGradle(modData));
            addFile(files, 'gradle.properties', generateGradleProperties(modData));
            addFile(files, 'gradlew', generateGradleWrapperScript('unix'));
            addFile(files, 'gradlew.bat', generateGradleWrapperScript('windows'));
            addFile(files, 'gradle/wrapper/gradle-wrapper.properties', generateGradleWrapperProperties(modData));
            addFile(files, 'src/main/resources/META-INF/mods.toml', generateModsToml(modData));
            addFile(files, 'src/main/resources/pack.mcmeta', generatePackMcmeta(modData));

            var mainClass = generateMainClass(modData);
            addFile(files, 'src/main/java/' + packageToPath(PACKAGE_BASE) + '/' + getMainClassName(modData) + '.java', mainClass);

            for (var i = 0; i < modData.blocks.length; i++) {
                var block = modData.blocks[i];
                var blockClass = generateBlockClass(modData, block);
                addFile(files, 'src/main/java/' + packageToPath(PACKAGE_BASE) + '/block/' + toPascalCase(block.id) + '.java', blockClass);
            }

            for (var j = 0; j < modData.items.length; j++) {
                var item = modData.items[j];
                if (item.type === 'block_item') continue;
                var itemClass = generateItemClass(modData, item);
                addFile(files, 'src/main/java/' + packageToPath(PACKAGE_BASE) + '/item/' + toPascalCase(item.id) + '.java', itemClass);
            }

            if (hasOffhandFeature(modData) || hasUndeadDamageFeature(modData)) {
                var itemClass2 = generateOffhandItemClass(modData);
                var existingBlock = modData.blocks.length > 0 ? modData.blocks[0] : null;
                if (existingBlock) {
                    addFile(files, 'src/main/java/' + packageToPath(PACKAGE_BASE) + '/item/' + toPascalCase(existingBlock.id) + 'Item.java', itemClass2);
                }
            }

            if (hasSpawnControlFeature(modData)) {
                var listenerClass = generateSpawnListenerClass(modData);
                addFile(files, 'src/main/java/' + packageToPath(PACKAGE_BASE) + '/event/MobSpawnListener.java', listenerClass);
            }

            for (var k = 0; k < modData.recipes.length; k++) {
                var recipe = modData.recipes[k];
                var recipeJson = generateRecipeJson(recipe, modData);
                addFile(files, 'src/main/resources/data/' + modData.modId + '/recipes/' + recipe.id + '.json', recipeJson);
            }

            addFile(files, 'src/main/resources/assets/' + modData.modId + '/lang/en_us.json', generateLangFile(modData, 'en_us'));
            addFile(files, 'src/main/resources/assets/' + modData.modId + '/lang/zh_cn.json', generateLangFile(modData, 'zh_cn'));

            for (var b = 0; b < modData.blocks.length; b++) {
                var block2 = modData.blocks[b];
                addFile(files, 'src/main/resources/assets/' + modData.modId + '/blockstates/' + block2.id + '.json', generateBlockStateJson(block2, modData));
                addFile(files, 'src/main/resources/assets/' + modData.modId + '/models/block/' + block2.id + '.json', generateBlockModelJson(block2, modData));
                addFile(files, 'src/main/resources/assets/' + modData.modId + '/models/item/' + block2.id + '.json', generateBlockItemModelJson(block2, modData));
            }

            for (var it = 0; it < modData.items.length; it++) {
                var item2 = modData.items[it];
                if (item2.type === 'block_item') continue;
                addFile(files, 'src/main/resources/assets/' + modData.modId + '/models/item/' + item2.id + '.json', generateItemModelJson(item2, modData));
            }

            structure.files = Object.keys(files);
            structure.dirs = extractDirectories(Object.keys(files));

            callback(null, {
                files: files,
                structure: structure,
                modData: modData
            });
        } catch (e) {
            callback(new Error('代码生成失败: ' + e.message), null);
        }
    }

    function addFile(files, path, content) {
        files[path] = content;
    }

    function packageToPath(pkg) {
        return pkg.replace(/\./g, '/');
    }

    function toPascalCase(str) {
        var parts = str.split('_');
        var result = '';
        for (var i = 0; i < parts.length; i++) {
            result += parts[i].charAt(0).toUpperCase() + parts[i].slice(1);
        }
        return result;
    }

    function getMainClassName(modData) {
        return toPascalCase(modData.modId);
    }

    function hasOffhandFeature(modData) {
        if (!modData.features) return false;
        for (var i = 0; i < modData.features.length; i++) {
            if (modData.features[i].type === 'offhand_effect') return true;
        }
        return false;
    }

    function hasUndeadDamageFeature(modData) {
        if (!modData.features) return false;
        for (var i = 0; i < modData.features.length; i++) {
            if (modData.features[i].type === 'undead_damage') return true;
        }
        return false;
    }

    function hasSpawnControlFeature(modData) {
        if (!modData.features) return false;
        for (var i = 0; i < modData.features.length; i++) {
            if (modData.features[i].type === 'spawn_control') return true;
        }
        return false;
    }

    function generateBuildGradle(modData) {
        var lines = [];
        lines.push('plugins {');
        if (modData.loader === 'forge') {
            lines.push("    id 'net.minecraftforge.gradle' version '5.1.+'");
        } else if (modData.loader === 'neoforge') {
            lines.push("    id 'net.neoforged.moddev' version '0.1.+'");
        } else if (modData.loader === 'fabric') {
            lines.push("    id 'fabric-loom' version '1.+'");
        }
        lines.push("    id 'java'");
        lines.push('}');
        lines.push('');
        lines.push("version = '" + modData.version + "'");
        lines.push("group = '" + PACKAGE_BASE + "'");
        lines.push("archivesBaseName = '" + modData.modId + "'");
        lines.push('');
        lines.push('java {');
        lines.push('    toolchain.languageVersion = JavaLanguageVersion.of(17)');
        lines.push('}');
        lines.push('');
        lines.push('minecraft {');
        if (modData.loader === 'forge') {
            lines.push("    mappings channel: 'official', version: '" + modData.mcVersion + "'");
            lines.push('');
            lines.push("    accessTransformer = file('src/main/resources/META-INF/accesstransformer.cfg')");
            lines.push('');
            lines.push('    runs {');
            lines.push('        client {');
            lines.push("            workingDirectory project.file('run')");
            lines.push('            property \"forge.logging.markers\", \"REGISTRIES\"');
            lines.push('            property \"forge.logging.console.level\", \"debug\"');
            lines.push('            mods {');
            lines.push('                ' + modData.modId + ' {');
            lines.push("                    source sourceSets.main");
            lines.push('                }');
            lines.push('            }');
            lines.push('        }');
            lines.push('');
            lines.push('        server {');
            lines.push("            workingDirectory project.file('run')");
            lines.push('            property \"forge.logging.markers\", \"REGISTRIES\"');
            lines.push('            property \"forge.logging.console.level\", \"debug\"');
            lines.push('            mods {');
            lines.push('                ' + modData.modId + ' {');
            lines.push("                    source sourceSets.main");
            lines.push('                }');
            lines.push('            }');
            lines.push('        }');
            lines.push('    }');
        }
        lines.push('}');
        lines.push('');
        lines.push('dependencies {');
        if (modData.loader === 'forge') {
            lines.push("    minecraft 'net.minecraftforge:forge:" + modData.mcVersion + '-' + (modData.loaderVersion || '47.2.0') + "'");
        }
        lines.push('}');
        lines.push('');
        lines.push('tasks.withType(JavaCompile).configureEach {');
        lines.push('    options.encoding = \"UTF-8\"');
        lines.push('}');
        lines.push('');
        lines.push('jar {');
        lines.push('    manifest {');
        lines.push('        attributes([');
        lines.push("            \"Specification-Title\"     : \"" + modData.modId + "\",");
        lines.push("            \"Specification-Vendor\"    : \"" + modData.author + "\",");
        lines.push("            \"Specification-Version\"   : \"1\",");
        lines.push("            \"Implementation-Title\"    : project.name,");
        lines.push("            \"Implementation-Version\"  : \"${version}\",");
        lines.push("            \"Implementation-Vendor\"   : \"" + modData.author + "\",");
        lines.push("            \"Implementation-Timestamp\": \"${new Date().format(\"yyyy-MM-dd'T'HH:mm:ssZ\")}\"");
        lines.push('        ])');
        lines.push('    }');
        lines.push('}');
        lines.push('');
        lines.push('reobfJar {');
        lines.push('    outputJar = file(\"build/libs/' + modData.modId + '-' + modData.mcVersion + '-' + modData.version + '.jar\")');
        lines.push('}');
        return lines.join('\n');
    }

    function generateSettingsGradle(modData) {
        var lines = [];
        lines.push("pluginManagement {");
        lines.push("    repositories {");
        lines.push("        gradlePluginPortal()");
        if (modData.loader === 'forge') {
            lines.push("        maven { url = 'https://maven.minecraftforge.net' }");
        } else if (modData.loader === 'neoforge') {
            lines.push("        maven { url = 'https://maven.neoforged.net/releases' }");
        } else if (modData.loader === 'fabric') {
            lines.push("        maven { url = 'https://maven.fabricmc.net/' }");
        }
        lines.push("        mavenCentral()");
        lines.push("    }");
        lines.push("}");
        lines.push("");
        lines.push("rootProject.name = '" + modData.modId + "'");
        return lines.join('\n');
    }

    function generateGradleProperties(modData) {
        var lines = [];
        lines.push("org.gradle.jvmargs=-Xmx3G");
        lines.push("org.gradle.daemon=false");
        lines.push("");
        lines.push("mod_id=" + modData.modId);
        lines.push("mod_name=" + modData.modName);
        lines.push("mod_version=" + modData.version);
        lines.push("mod_author=" + modData.author);
        lines.push("mod_license=" + (modData.license || "MIT"));
        lines.push("mod_description=" + (modData.description || "").replace(/\n/g, " "));
        lines.push("");
        lines.push("minecraft_version=" + modData.mcVersion);
        lines.push("loader_version=" + (modData.loaderVersion || ""));
        return lines.join('\n');
    }

    function generateGradleWrapperScript(os) {
        if (os === 'windows') {
            return '@rem Gradle start up script for Windows\n@echo off\nset DIRNAME=%~dp0\nif "%DIRNAME%" == "" set DIRNAME=.\nset APP_BASE_NAME=%~n0\nset APP_HOME=%DIRNAME%\nset CLASSPATH=%APP_HOME%\\gradle\\wrapper\\gradle-wrapper.jar\njava -cp "%CLASSPATH%" org.gradle.wrapper.GradleWrapperMain %*\n';
        }
        return '#!/bin/sh\nDIRNAME=`dirname "$0"`\nAPP_BASE_NAME=`basename "$0"`\nAPP_HOME=`cd "$DIRNAME" && pwd`\nCLASSPATH=$APP_HOME/gradle/wrapper/gradle-wrapper.jar\nexec java -cp "$CLASSPATH" org.gradle.wrapper.GradleWrapperMain "$@"\n';
    }

    function generateGradleWrapperProperties(modData) {
        var gradleVersion = modData.mcVersion >= '1.20.6' ? '8.5' : '8.1.1';
        return 'distributionBase=GRADLE_USER_HOME\n' +
               'distributionPath=wrapper/dists\n' +
               'distributionUrl=https\\://services.gradle.org/distributions/gradle-' + gradleVersion + '-bin.zip\n' +
               'networkTimeout=10000\n' +
               'zipStoreBase=GRADLE_USER_HOME\n' +
               'zipStorePath=wrapper/dists\n';
    }

    function generateModsToml(modData) {
        var lines = [];
        lines.push('modLoader="javafml"');
        lines.push('loaderVersion="[1,)"');
        lines.push('license="' + (modData.license || 'MIT') + '"');
        if (modData.description) {
            lines.push('issueTrackerURL="https://github.com/' + modData.modId + '/issues"');
        }
        lines.push('showAsResourcePack=false');
        lines.push('');
        lines.push('[[mods]]');
        lines.push('modId="' + modData.modId + '"');
        lines.push('version="' + modData.version + '"');
        lines.push('displayName="' + modData.modName + '"');
        lines.push('authors="' + modData.author + '"');
        lines.push('description="""' + (modData.description || '') + '"""');
        lines.push('displayURL="https://github.com/' + modData.modId + '"');
        lines.push('license="' + (modData.license || 'MIT') + '"');
        lines.push('');
        lines.push('[[dependencies.' + modData.modId + ']]');
        lines.push('modId="forge"');
        lines.push('mandatory=true');
        lines.push('versionRange="[47,48)"');
        lines.push('ordering="NONE"');
        lines.push('side="BOTH"');
        lines.push('');
        lines.push('[[dependencies.' + modData.modId + ']]');
        lines.push('modId="minecraft"');
        lines.push('mandatory=true');
        lines.push('versionRange="[' + modData.mcVersion + ',1.21)"');
        lines.push('ordering="NONE"');
        lines.push('side="BOTH"');
        return lines.join('\n');
    }

    function generatePackMcmeta(modData) {
        return JSON.stringify({
            pack: {
                description: modData.modName + ' resources',
                pack_format: 15
            }
        }, null, 2);
    }

    function generateMainClass(modData) {
        var className = getMainClassName(modData);
        var lines = [];
        lines.push('package ' + PACKAGE_BASE + ';');
        lines.push('');
        lines.push('import net.minecraft.world.item.Item;');
        lines.push('import net.minecraft.world.level.block.Block;');
        lines.push('import net.minecraftforge.eventbus.api.IEventBus;');
        lines.push('import net.minecraftforge.fml.common.Mod;');
        lines.push('import net.minecraftforge.fml.javafmlmod.FMLJavaModLoadingContext;');
        lines.push('import net.minecraftforge.registries.DeferredRegister;');
        lines.push('import net.minecraftforge.registries.ForgeRegistries;');
        lines.push('import net.minecraftforge.registries.RegistryObject;');
        lines.push('');

        for (var i = 0; i < modData.blocks.length; i++) {
            var blockName = toPascalCase(modData.blocks[i].id);
            lines.push('import ' + PACKAGE_BASE + '.block.' + blockName + ';');
        }

        lines.push('');
        lines.push('@Mod(' + className + '.MOD_ID)');
        lines.push('public class ' + className + ' {');
        lines.push('    public static final String MOD_ID = "' + modData.modId + '";');
        lines.push('');
        lines.push('    public static final DeferredRegister<Block> BLOCKS = DeferredRegister.create(ForgeRegistries.BLOCKS, MOD_ID);');
        lines.push('    public static final DeferredRegister<Item> ITEMS = DeferredRegister.create(ForgeRegistries.ITEMS, MOD_ID);');
        lines.push('');

        for (var j = 0; j < modData.blocks.length; j++) {
            var block = modData.blocks[j];
            var bName = toPascalCase(block.id);
            var regName = block.id.toUpperCase();
            lines.push('    public static final RegistryObject<' + bName + '> ' + regName + ' = BLOCKS.register("' + block.id + '",');
            lines.push('            () -> new ' + bName + '(net.minecraft.world.level.block.state.BlockBehaviour.Properties.of()');
            if (block.properties) {
                if (block.properties.strength !== undefined) {
                    lines.push('                    .strength(' + block.properties.strength + 'f)');
                }
                if (block.properties.noOcclusion) {
                    lines.push('                    .noOcclusion()');
                }
                if (block.properties.lightLevel !== undefined) {
                    lines.push('                    .lightLevel(state -> ' + block.properties.lightLevel + ')');
                }
                if (block.properties.soundType) {
                    lines.push('                    .sound(net.minecraft.world.level.block.SoundType.' + block.properties.soundType + ')');
                }
            }
            lines.push('            ));');
            lines.push('');
        }

        for (var k = 0; k < modData.blocks.length; k++) {
            var block2 = modData.blocks[k];
            var bName2 = toPascalCase(block2.id);
            var regName2 = block2.id.toUpperCase();
            var hasCustomItem = hasOffhandFeature(modData) || hasUndeadDamageFeature(modData);
            if (hasCustomItem) {
                lines.push('    public static final RegistryObject<Item> ' + regName2 + '_ITEM = ITEMS.register("' + block2.id + '",');
                lines.push('            () -> new ' + bName2 + 'Item(' + regName2 + '.get(), new Item.Properties()));');
            } else {
                lines.push('    public static final RegistryObject<Item> ' + regName2 + '_ITEM = ITEMS.register("' + block2.id + '",');
                lines.push('            () -> new net.minecraft.world.item.BlockItem(' + regName2 + '.get(), new Item.Properties()));');
            }
            lines.push('');
        }

        lines.push('    public ' + className + '() {');
        lines.push('        IEventBus bus = FMLJavaModLoadingContext.get().getModEventBus();');
        lines.push('        BLOCKS.register(bus);');
        lines.push('        ITEMS.register(bus);');
        lines.push('    }');
        lines.push('}');
        return lines.join('\n');
    }

    function generateBlockClass(modData, block) {
        var className = toPascalCase(block.id);
        var lines = [];
        lines.push('package ' + PACKAGE_BASE + '.block;');
        lines.push('');
        lines.push('import net.minecraft.core.BlockPos;');
        lines.push('import net.minecraft.world.level.BlockGetter;');
        lines.push('import net.minecraft.world.level.block.Block;');
        lines.push('import net.minecraft.world.level.block.state.BlockState;');
        lines.push('import net.minecraft.world.phys.shapes.CollisionContext;');
        lines.push('import net.minecraft.world.phys.shapes.VoxelShape;');
        lines.push('');
        lines.push('public class ' + className + ' extends Block {');
        lines.push('    private static final VoxelShape SHAPE = Block.box(0.0D, 0.0D, 0.0D, 16.0D, 16.0D, 16.0D);');
        lines.push('');
        lines.push('    public ' + className + '(Properties properties) {');
        lines.push('        super(properties);');
        lines.push('    }');
        lines.push('');
        lines.push('    @Override');
        lines.push('    public VoxelShape getShape(BlockState state, BlockGetter getter, BlockPos pos, CollisionContext context) {');
        lines.push('        return SHAPE;');
        lines.push('    }');
        lines.push('}');
        return lines.join('\n');
    }

    function generateItemClass(modData, item) {
        var className = toPascalCase(item.id);
        var lines = [];
        lines.push('package ' + PACKAGE_BASE + '.item;');
        lines.push('');
        lines.push('import net.minecraft.world.item.Item;');
        lines.push('');
        lines.push('public class ' + className + ' extends Item {');
        lines.push('    public ' + className + '(Properties properties) {');
        lines.push('        super(properties);');
        lines.push('    }');
        lines.push('}');
        return lines.join('\n');
    }

    function generateOffhandItemClass(modData) {
        var block = modData.blocks.length > 0 ? modData.blocks[0] : null;
        if (!block) return '';
        var className = toPascalCase(block.id) + 'Item';
        var lines = [];
        lines.push('package ' + PACKAGE_BASE + '.item;');
        lines.push('');
        lines.push('import ' + PACKAGE_BASE + '.block.' + toPascalCase(block.id) + ';');
        lines.push('import net.minecraft.world.entity.Entity;');
        lines.push('import net.minecraft.world.entity.LivingEntity;');
        lines.push('import net.minecraft.world.entity.monster.Zombie;');
        lines.push('import net.minecraft.world.entity.monster.Skeleton;');
        lines.push('import net.minecraft.world.entity.monster.WitherSkeleton;');
        lines.push('import net.minecraft.world.item.BlockItem;');
        lines.push('import net.minecraft.world.item.ItemStack;');
        lines.push('import net.minecraft.world.level.Level;');
        lines.push('import net.minecraft.world.phys.AABB;');
        lines.push('');
        lines.push('import java.util.List;');
        lines.push('');
        lines.push('public class ' + className + ' extends BlockItem {');
        lines.push('    public ' + className + '(' + toPascalCase(block.id) + ' block, Properties properties) {');
        lines.push('        super(block, properties);');
        lines.push('    }');
        lines.push('');
        lines.push('    @Override');
        lines.push('    public void inventoryTick(ItemStack stack, Level level, Entity entity, int slot, boolean selected) {');
        lines.push('        super.inventoryTick(stack, level, entity, slot, selected);');
        lines.push('        if (!level.isClientSide && entity instanceof LivingEntity && slot == 40) {');
        lines.push('            LivingEntity livingEntity = (LivingEntity) entity;');
        lines.push('            long gameTime = level.getGameTime();');
        lines.push('            if (gameTime % 20 == 0) {');
        lines.push('                applyDamageToNearbyUndead(livingEntity, level);');
        lines.push('            }');
        lines.push('        }');
        lines.push('    }');
        lines.push('');
        lines.push('    private void applyDamageToNearbyUndead(LivingEntity holder, Level level) {');
        lines.push('        AABB area = new AABB(holder.blockPosition()).inflate(5.0D);');
        lines.push('        List<LivingEntity> entities = level.getEntitiesOfClass(LivingEntity.class, area);');
        lines.push('');
        lines.push('        for (LivingEntity target : entities) {');
        lines.push('            if (isUndead(target) && target != holder) {');
        lines.push('                target.hurt(level.damageSources().magic(), 2.0F);');
        lines.push('            }');
        lines.push('        }');
        lines.push('    }');
        lines.push('');
        lines.push('    private boolean isUndead(LivingEntity entity) {');
        lines.push('        return entity instanceof Zombie ||');
        lines.push('               entity instanceof Skeleton ||');
        lines.push('               entity instanceof WitherSkeleton;');
        lines.push('    }');
        lines.push('}');
        return lines.join('\n');
    }

    function generateSpawnListenerClass(modData) {
        var block = modData.blocks.length > 0 ? modData.blocks[0] : null;
        if (!block) return '';
        var lines = [];
        lines.push('package ' + PACKAGE_BASE + '.event;');
        lines.push('');
        lines.push('import ' + PACKAGE_BASE + '.block.' + toPascalCase(block.id) + ';');
        lines.push('import net.minecraft.core.BlockPos;');
        lines.push('import net.minecraft.world.entity.Entity;');
        lines.push('import net.minecraft.world.entity.monster.Monster;');
        lines.push('import net.minecraft.world.level.Level;');
        lines.push('import net.minecraft.world.level.block.state.BlockState;');
        lines.push('import net.minecraftforge.event.entity.EntityJoinLevelEvent;');
        lines.push('import net.minecraftforge.eventbus.api.SubscribeEvent');
        lines.push('import net.minecraftforge.fml.common.Mod;');
        lines.push('');
        lines.push('@Mod.EventBusSubscriber(modId = "' + modData.modId + '")');
        lines.push('public class MobSpawnListener {');
        lines.push('    @SubscribeEvent');
        lines.push('    public static void onEntityJoin(EntityJoinLevelEvent event) {');
        lines.push('        Entity entity = event.getEntity();');
        lines.push('        if (entity instanceof Monster) {');
        lines.push('            Level level = event.getLevel();');
        lines.push('            BlockPos pos = entity.blockPosition();');
        lines.push('            if (isNearLightBlock(level, pos, 8)) {');
        lines.push('                event.setCanceled(true);');
        lines.push('            }');
        lines.push('        }');
        lines.push('    }');
        lines.push('');
        lines.push('    private static boolean isNearLightBlock(Level level, BlockPos center, int range) {');
        lines.push('        for (int x = -range; x <= range; x++) {');
        lines.push('            for (int y = -range; y <= range; y++) {');
        lines.push('                for (int z = -range; z <= range; z++) {');
        lines.push('                    BlockPos pos = center.offset(x, y, z);');
        lines.push('                    BlockState state = level.getBlockState(pos);');
        lines.push('                    if (state.getBlock() instanceof ' + toPascalCase(block.id) + ') {');
        lines.push('                        return true;');
        lines.push('                    }');
        lines.push('                }');
        lines.push('            }');
        lines.push('        }');
        lines.push('        return false;');
        lines.push('    }');
        lines.push('}');
        return lines.join('\n');
    }

    function generateRecipeJson(recipe, modData) {
        return JSON.stringify({
            type: 'minecraft:' + recipe.type,
            pattern: recipe.pattern,
            key: recipe.key,
            result: recipe.result
        }, null, 2);
    }

    function generateLangFile(modData, locale) {
        var lang = {};
        var isZh = locale === 'zh_cn';

        lang['itemGroup.' + modData.modId] = isZh ? modData.modName : modData.modName;

        for (var i = 0; i < modData.blocks.length; i++) {
            var block = modData.blocks[i];
            lang['block.' + modData.modId + '.' + block.id] = block.name;
            lang['item.' + modData.modId + '.' + block.id] = block.name;
        }

        for (var j = 0; j < modData.items.length; j++) {
            var item = modData.items[j];
            if (item.type === 'block_item') continue;
            lang['item.' + modData.modId + '.' + item.id] = item.name;
        }

        return JSON.stringify(lang, null, 2);
    }

    function generateBlockStateJson(block, modData) {
        return JSON.stringify({
            variants: {
                '': { model: modData.modId + ':block/' + block.id }
            }
        }, null, 2);
    }

    function generateBlockModelJson(block, modData) {
        return JSON.stringify({
            parent: 'minecraft:block/cube_all',
            textures: {
                all: modData.modId + ':block/' + block.id
            }
        }, null, 2);
    }

    function generateBlockItemModelJson(block, modData) {
        return JSON.stringify({
            parent: modData.modId + ':block/' + block.id
        }, null, 2);
    }

    function generateItemModelJson(item, modData) {
        return JSON.stringify({
            parent: 'minecraft:item/generated',
            textures: {
                layer0: modData.modId + ':item/' + item.id
            }
        }, null, 2);
    }

    function extractDirectories(files) {
        var dirs = {};
        for (var i = 0; i < files.length; i++) {
            var parts = files[i].split('/');
            var path = '';
            for (var j = 0; j < parts.length - 1; j++) {
                path += (path ? '/' : '') + parts[j];
                dirs[path] = true;
            }
        }
        return Object.keys(dirs).sort();
    }

    function generateReadme(modData) {
        return '# ' + modData.modName + '\n\n' +
               '## 模组信息\n' +
               '- **模组ID**: ' + modData.modId + '\n' +
               '- **版本**: ' + modData.version + '\n' +
               '- **游戏版本**: ' + modData.mcVersion + '\n' +
               '- **加载器**: ' + modData.loader + '\n' +
               '- **作者**: ' + modData.author + '\n\n' +
               '## 功能介绍\n' +
               (modData.description || '') + '\n\n' +
               '## 使用说明\n' +
               '将生成的 JAR 文件放入 Minecraft 客户端的 mods 文件夹中即可。\n\n' +
               '## 构建\n' +
               '```bash\n' +
               './gradlew build\n' +
               '```\n';
    }

    return {
        generateModProject: generateModProject,
        generateBuildGradle: generateBuildGradle,
        generateModsToml: generateModsToml,
        generateMainClass: generateMainClass,
        generateLangFile: generateLangFile,
        generateRecipeJson: generateRecipeJson,
        generateReadme: generateReadme
    };
})();