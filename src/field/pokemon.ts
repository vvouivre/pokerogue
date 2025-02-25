import Phaser from "phaser";
import type { AnySound } from "#app/battle-scene";
import type BattleScene from "#app/battle-scene";
import { globalScene } from "#app/global-scene";
import type { Variant, VariantSet } from "#app/data/variant";
import { variantColorCache } from "#app/data/variant";
import { variantData } from "#app/data/variant";
import BattleInfo, { PlayerBattleInfo, EnemyBattleInfo } from "#app/ui/battle-info";
import type Move from "#app/data/move";
import {
  HighCritAttr,
  StatChangeBeforeDmgCalcAttr,
  HitsTagAttr,
  applyMoveAttrs,
  FixedDamageAttr,
  VariableAtkAttr,
  allMoves,
  MoveCategory,
  TypelessAttr,
  CritOnlyAttr,
  getMoveTargets,
  OneHitKOAttr,
  VariableMoveTypeAttr,
  VariableDefAttr,
  AttackMove,
  ModifiedDamageAttr,
  VariableMoveTypeMultiplierAttr,
  IgnoreOpponentStatStagesAttr,
  SacrificialAttr,
  VariableMoveCategoryAttr,
  CounterDamageAttr,
  StatStageChangeAttr,
  RechargeAttr,
  IgnoreWeatherTypeDebuffAttr,
  BypassBurnDamageReductionAttr,
  SacrificialAttrOnHit,
  OneHitKOAccuracyAttr,
  RespectAttackTypeImmunityAttr,
  MoveTarget,
  CombinedPledgeStabBoostAttr,
  VariableMoveTypeChartAttr,
  HpSplitAttr
} from "#app/data/move";
import type { PokemonSpeciesForm } from "#app/data/pokemon-species";
import { default as PokemonSpecies, getFusedSpeciesName, getPokemonSpecies, getPokemonSpeciesForm } from "#app/data/pokemon-species";
import { getStarterValueFriendshipCap, speciesStarterCosts } from "#app/data/balance/starters";
import type { Constructor } from "#app/utils";
import { isNullOrUndefined, randSeedInt, type nil } from "#app/utils";
import * as Utils from "#app/utils";
import type { TypeDamageMultiplier } from "#app/data/type";
import { getTypeDamageMultiplier, getTypeRgb } from "#app/data/type";
import { Type } from "#enums/type";
import { getLevelTotalExp } from "#app/data/exp";
import { Stat, type PermanentStat, type BattleStat, type EffectiveStat, PERMANENT_STATS, BATTLE_STATS, EFFECTIVE_STATS } from "#enums/stat";
import { DamageMoneyRewardModifier, EnemyDamageBoosterModifier, EnemyDamageReducerModifier, EnemyEndureChanceModifier, EnemyFusionChanceModifier, HiddenAbilityRateBoosterModifier, BaseStatModifier, PokemonFriendshipBoosterModifier, PokemonHeldItemModifier, PokemonNatureWeightModifier, ShinyRateBoosterModifier, SurviveDamageModifier, TempStatStageBoosterModifier, TempCritBoosterModifier, StatBoosterModifier, CritBoosterModifier, PokemonBaseStatFlatModifier, PokemonBaseStatTotalModifier, PokemonIncrementingStatModifier, EvoTrackerModifier, PokemonMultiHitModifier } from "#app/modifier/modifier";
import { PokeballType } from "#enums/pokeball";
import { Gender } from "#app/data/gender";
import { initMoveAnim, loadMoveAnimAssets } from "#app/data/battle-anims";
import { Status, getRandomStatus } from "#app/data/status-effect";
import type { SpeciesFormEvolution, SpeciesEvolutionCondition } from "#app/data/balance/pokemon-evolutions";
import { pokemonEvolutions, pokemonPrevolutions, FusionSpeciesFormEvolution } from "#app/data/balance/pokemon-evolutions";
import { reverseCompatibleTms, tmSpecies, tmPoolTiers } from "#app/data/balance/tms";
import { BattlerTag, BattlerTagLapseType, EncoreTag, GroundedTag, HighestStatBoostTag, SubstituteTag, TypeImmuneTag, getBattlerTag, SemiInvulnerableTag, TypeBoostTag, MoveRestrictionBattlerTag, ExposedTag, DragonCheerTag, CritBoostTag, TrappedTag, TarShotTag, AutotomizedTag, PowerTrickTag } from "../data/battler-tags";
import { WeatherType } from "#enums/weather-type";
import { ArenaTagSide, NoCritTag, WeakenMoveScreenTag } from "#app/data/arena-tag";
import type { SuppressAbilitiesTag } from "#app/data/arena-tag";
import type { Ability, AbAttr } from "#app/data/ability";
import { StatMultiplierAbAttr, BlockCritAbAttr, BonusCritAbAttr, BypassBurnDamageReductionAbAttr, FieldPriorityMoveImmunityAbAttr, IgnoreOpponentStatStagesAbAttr, MoveImmunityAbAttr, PreDefendFullHpEndureAbAttr, ReceivedMoveDamageMultiplierAbAttr, StabBoostAbAttr, StatusEffectImmunityAbAttr, TypeImmunityAbAttr, WeightMultiplierAbAttr, allAbilities, applyAbAttrs, applyStatMultiplierAbAttrs, applyPreApplyBattlerTagAbAttrs, applyPreAttackAbAttrs, applyPreDefendAbAttrs, applyPreSetStatusAbAttrs, UnsuppressableAbilityAbAttr, NoFusionAbilityAbAttr, MultCritAbAttr, IgnoreTypeImmunityAbAttr, DamageBoostAbAttr, IgnoreTypeStatusEffectImmunityAbAttr, ConditionalCritAbAttr, applyFieldStatMultiplierAbAttrs, FieldMultiplyStatAbAttr, AddSecondStrikeAbAttr, UserFieldStatusEffectImmunityAbAttr, UserFieldBattlerTagImmunityAbAttr, BattlerTagImmunityAbAttr, MoveTypeChangeAbAttr, FullHpResistTypeAbAttr, applyCheckTrappedAbAttrs, CheckTrappedAbAttr, PostSetStatusAbAttr, applyPostSetStatusAbAttrs, InfiltratorAbAttr, AlliedFieldDamageReductionAbAttr, PostDamageAbAttr, applyPostDamageAbAttrs, CommanderAbAttr, applyPostItemLostAbAttrs, PostItemLostAbAttr, applyOnGainAbAttrs, PreLeaveFieldAbAttr, applyPreLeaveFieldAbAttrs, applyOnLoseAbAttrs, PreLeaveFieldRemoveSuppressAbilitiesSourceAbAttr } from "#app/data/ability";
import type PokemonData from "#app/system/pokemon-data";
import { BattlerIndex } from "#app/battle";
import { Mode } from "#app/ui/ui";
import type { PartyOption } from "#app/ui/party-ui-handler";
import PartyUiHandler, { PartyUiMode } from "#app/ui/party-ui-handler";
import SoundFade from "phaser3-rex-plugins/plugins/soundfade";
import type { LevelMoves } from "#app/data/balance/pokemon-level-moves";
import { EVOLVE_MOVE, RELEARN_MOVE } from "#app/data/balance/pokemon-level-moves";
import { DamageAchv, achvs } from "#app/system/achv";
import type { StarterDataEntry, StarterMoveset } from "#app/system/game-data";
import { DexAttr } from "#app/system/game-data";
import { QuantizerCelebi, argbFromRgba, rgbaFromArgb } from "@material/material-color-utilities";
import { getNatureStatMultiplier } from "#app/data/nature";
import type { SpeciesFormChange } from "#app/data/pokemon-forms";
import { SpeciesFormChangeActiveTrigger, SpeciesFormChangeLapseTeraTrigger, SpeciesFormChangeMoveLearnedTrigger, SpeciesFormChangePostMoveTrigger, SpeciesFormChangeStatusEffectTrigger } from "#app/data/pokemon-forms";
import { TerrainType } from "#app/data/terrain";
import type { TrainerSlot } from "#app/data/trainer-config";
import Overrides from "#app/overrides";
import i18next from "i18next";
import { speciesEggMoves } from "#app/data/balance/egg-moves";
import { ModifierTier } from "#app/modifier/modifier-tier";
import { applyChallenges, ChallengeType } from "#app/data/challenge";
import { Abilities } from "#enums/abilities";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattleSpec } from "#enums/battle-spec";
import { BattlerTagType } from "#enums/battler-tag-type";
import type { BerryType } from "#enums/berry-type";
import { Biome } from "#enums/biome";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { getPokemonNameWithAffix } from "#app/messages";
import { DamageAnimPhase } from "#app/phases/damage-anim-phase";
import { FaintPhase } from "#app/phases/faint-phase";
import { LearnMovePhase } from "#app/phases/learn-move-phase";
import { MoveEffectPhase } from "#app/phases/move-effect-phase";
import { MoveEndPhase } from "#app/phases/move-end-phase";
import { ObtainStatusEffectPhase } from "#app/phases/obtain-status-effect-phase";
import { StatStageChangePhase } from "#app/phases/stat-stage-change-phase";
import { SwitchSummonPhase } from "#app/phases/switch-summon-phase";
import { Challenges } from "#enums/challenges";
import { PokemonAnimType } from "#enums/pokemon-anim-type";
import { PLAYER_PARTY_MAX_SIZE } from "#app/constants";
import { CustomPokemonData } from "#app/data/custom-pokemon-data";
import { SwitchType } from "#enums/switch-type";
import { SpeciesFormKey } from "#enums/species-form-key";
import { BASE_HIDDEN_ABILITY_CHANCE, BASE_SHINY_CHANCE, SHINY_EPIC_CHANCE, SHINY_VARIANT_CHANCE } from "#app/data/balance/rates";
import { Nature } from "#enums/nature";
import { StatusEffect } from "#enums/status-effect";
import { doShinySparkleAnim } from "#app/field/anims";

export enum LearnMoveSituation {
  MISC,
  LEVEL_UP,
  RELEARN,
  EVOLUTION,
  EVOLUTION_FUSED, // If fusionSpecies has Evolved
  EVOLUTION_FUSED_BASE // If fusion's base species has Evolved
}

export enum FieldPosition {
  CENTER,
  LEFT,
  RIGHT
}

export default abstract class Pokemon extends Phaser.GameObjects.Container {
  public id: number;
  public name: string;
  public nickname: string;
  public species: PokemonSpecies;
  public formIndex: number;
  public abilityIndex: number;
  public passive: boolean;
  public shiny: boolean;
  public variant: Variant;
  public pokeball: PokeballType;
  protected battleInfo: BattleInfo;
  public level: number;
  public exp: number;
  public levelExp: number;
  public gender: Gender;
  public hp: number;
  public stats: number[];
  public ivs: number[];
  public nature: Nature;
  public moveset: (PokemonMove | null)[];
  public status: Status | null;
  public friendship: number;
  public metLevel: number;
  public metBiome: Biome | -1;
  public metSpecies: Species;
  public metWave: number;
  public luck: number;
  public pauseEvolutions: boolean;
  public pokerus: boolean;
  public switchOutStatus: boolean;
  public evoCounter: number;
  public teraType: Type;
  public isTerastallized: boolean;
  public stellarTypesBoosted: Type[];

  public fusionSpecies: PokemonSpecies | null;
  public fusionFormIndex: number;
  public fusionAbilityIndex: number;
  public fusionShiny: boolean;
  public fusionVariant: Variant;
  public fusionGender: Gender;
  public fusionLuck: number;
  public fusionCustomPokemonData: CustomPokemonData | null;
  public fusionTeraType: Type;

  private summonDataPrimer: PokemonSummonData | null;

  public summonData: PokemonSummonData;
  public battleData: PokemonBattleData;
  public battleSummonData: PokemonBattleSummonData;
  public turnData: PokemonTurnData;
  public customPokemonData: CustomPokemonData;

  /** Used by Mystery Encounters to execute pokemon-specific logic (such as stat boosts) at start of battle */
  public mysteryEncounterBattleEffects?: (pokemon: Pokemon) => void;

  public fieldPosition: FieldPosition;

  public maskEnabled: boolean;
  public maskSprite: Phaser.GameObjects.Sprite | null;

  public usedTMs: Moves[];

  private shinySparkle: Phaser.GameObjects.Sprite;

  constructor(x: number, y: number, species: PokemonSpecies, level: number, abilityIndex?: number, formIndex?: number, gender?: Gender, shiny?: boolean, variant?: Variant, ivs?: number[], nature?: Nature, dataSource?: Pokemon | PokemonData) {
    super(globalScene, x, y);

    if (!species.isObtainable() && this.isPlayer()) {
      throw `Cannot create a player Pokemon for species '${species.getName(formIndex)}'`;
    }

    const hiddenAbilityChance = new Utils.NumberHolder(BASE_HIDDEN_ABILITY_CHANCE);
    if (!this.hasTrainer()) {
      globalScene.applyModifiers(HiddenAbilityRateBoosterModifier, true, hiddenAbilityChance);
    }

    this.species = species;
    this.pokeball = dataSource?.pokeball || PokeballType.POKEBALL;
    this.level = level;
    this.switchOutStatus = false;

    // Determine the ability index
    if (abilityIndex !== undefined) {
      this.abilityIndex = abilityIndex; // Use the provided ability index if it is defined
    } else {
      // If abilityIndex is not provided, determine it based on species and hidden ability
      const hasHiddenAbility = !Utils.randSeedInt(hiddenAbilityChance.value);
      const randAbilityIndex = Utils.randSeedInt(2);
      if (species.abilityHidden && hasHiddenAbility) {
        // If the species has a hidden ability and the hidden ability is present
        this.abilityIndex = 2;
      } else {
        // If there is no hidden ability or species does not have a hidden ability
        this.abilityIndex = species.ability2 !== species.ability1 ? randAbilityIndex : 0; // Use random ability index if species has a second ability, otherwise use 0
      }
    }
    if (formIndex !== undefined) {
      this.formIndex = formIndex;
    }
    if (gender !== undefined) {
      this.gender = gender;
    }
    if (shiny !== undefined) {
      this.shiny = shiny;
    }
    if (variant !== undefined) {
      this.variant = variant;
    }
    this.exp = dataSource?.exp || getLevelTotalExp(this.level, species.growthRate);
    this.levelExp = dataSource?.levelExp || 0;
    if (dataSource) {
      this.id = dataSource.id;
      this.hp = dataSource.hp;
      this.stats = dataSource.stats;
      this.ivs = dataSource.ivs;
      this.passive = !!dataSource.passive;
      if (this.variant === undefined) {
        this.variant = 0;
      }
      this.nature = dataSource.nature || 0 as Nature;
      this.nickname = dataSource.nickname;
      this.moveset = dataSource.moveset;
      this.status = dataSource.status!; // TODO: is this bang correct?
      this.friendship = dataSource.friendship !== undefined ? dataSource.friendship : this.species.baseFriendship;
      this.metLevel = dataSource.metLevel || 5;
      this.luck = dataSource.luck;
      this.metBiome = dataSource.metBiome;
      this.metSpecies = dataSource.metSpecies ?? (this.metBiome !== -1 ? this.species.speciesId : this.species.getRootSpeciesId(true));
      this.metWave = dataSource.metWave ?? (this.metBiome === -1 ? -1 : 0);
      this.pauseEvolutions = dataSource.pauseEvolutions;
      this.pokerus = !!dataSource.pokerus;
      this.evoCounter = dataSource.evoCounter ?? 0;
      this.fusionSpecies = dataSource.fusionSpecies instanceof PokemonSpecies ? dataSource.fusionSpecies : dataSource.fusionSpecies ? getPokemonSpecies(dataSource.fusionSpecies) : null;
      this.fusionFormIndex = dataSource.fusionFormIndex;
      this.fusionAbilityIndex = dataSource.fusionAbilityIndex;
      this.fusionShiny = dataSource.fusionShiny;
      this.fusionVariant = dataSource.fusionVariant || 0;
      this.fusionGender = dataSource.fusionGender;
      this.fusionLuck = dataSource.fusionLuck;
      this.fusionCustomPokemonData = dataSource.fusionCustomPokemonData;
      this.fusionTeraType = dataSource.fusionTeraType;
      this.usedTMs = dataSource.usedTMs ?? [];
      this.customPokemonData = new CustomPokemonData(dataSource.customPokemonData);
      this.teraType = dataSource.teraType;
      this.isTerastallized = dataSource.isTerastallized;
      this.stellarTypesBoosted = dataSource.stellarTypesBoosted ?? [];
    } else {
      this.id = Utils.randSeedInt(4294967296);
      this.ivs = ivs || Utils.getIvsFromId(this.id);

      if (this.gender === undefined) {
        this.generateGender();
      }

      if (this.formIndex === undefined) {
        this.formIndex = globalScene.getSpeciesFormIndex(species, this.gender, this.nature, this.isPlayer());
      }

      if (this.shiny === undefined) {
        this.trySetShiny();
      }

      if (this.variant === undefined) {
        this.variant = this.shiny ? this.generateShinyVariant() : 0;
      }

      this.customPokemonData = new CustomPokemonData();

      if (nature !== undefined) {
        this.setNature(nature);
      } else {
        this.generateNature();
      }

      this.friendship = species.baseFriendship;
      this.metLevel = level;
      this.metBiome = globalScene.currentBattle ? globalScene.arena.biomeType : -1;
      this.metSpecies = species.speciesId;
      this.metWave = globalScene.currentBattle ? globalScene.currentBattle.waveIndex : -1;
      this.pokerus = false;

      if (level > 1) {
        const fused = new Utils.BooleanHolder(globalScene.gameMode.isSplicedOnly);
        if (!fused.value && !this.isPlayer() && !this.hasTrainer()) {
          globalScene.applyModifier(EnemyFusionChanceModifier, false, fused);
        }

        if (fused.value) {
          this.calculateStats();
          this.generateFusionSpecies();
        }
      }
      this.luck = (this.shiny ? this.variant + 1 : 0) + (this.fusionShiny ? this.fusionVariant + 1 : 0);
      this.fusionLuck = this.luck;

      this.teraType = Utils.randSeedItem(this.getTypes(false, false, true));
      this.isTerastallized = false;
      this.stellarTypesBoosted = [];
    }

    this.generateName();

    if (!species.isObtainable()) {
      this.shiny = false;
    }

    if (!dataSource) {
      this.calculateStats();
    }
  }


  getNameToRender() {
    try {
      if (this.nickname) {
        return decodeURIComponent(escape(atob(this.nickname)));
      }
      return this.name;
    } catch (err) {
      console.error(`Failed to decode nickname for ${this.name}`, err);
      return this.name;
    }
  }

  init(): void {
    this.fieldPosition = FieldPosition.CENTER;

    this.initBattleInfo();

    globalScene.fieldUI.addAt(this.battleInfo, 0);

    const getSprite = (hasShadow?: boolean) => {
      const ret = globalScene.addPokemonSprite(this, 0, 0, `pkmn__${this.isPlayer() ? "back__" : ""}sub`, undefined, true);
      ret.setOrigin(0.5, 1);
      ret.setPipeline(globalScene.spritePipeline, { tone: [ 0.0, 0.0, 0.0, 0.0 ], hasShadow: !!hasShadow, teraColor: getTypeRgb(this.getTeraType()), isTerastallized: this.isTerastallized });
      return ret;
    };

    this.setScale(this.getSpriteScale());

    const sprite = getSprite(true);
    const tintSprite = getSprite();

    tintSprite.setVisible(false);

    this.addAt(sprite, 0);
    this.addAt(tintSprite, 1);

    if (this.isShiny() && !this.shinySparkle) {
      this.initShinySparkle();
    }
  }

  abstract initBattleInfo(): void;

  isOnField(): boolean {
    if (!globalScene) {
      return false;
    }
    if (this.switchOutStatus) {
      return false;
    }
    return globalScene.field.getIndex(this) > -1;
  }

  /**
   * Checks if a pokemon is fainted (ie: its `hp <= 0`).
   * It's usually better to call {@linkcode isAllowedInBattle()}
   * @param checkStatus `true` to also check that the pokemon's status is {@linkcode StatusEffect.FAINT}
   * @returns `true` if the pokemon is fainted
   */
  public isFainted(checkStatus: boolean = false): boolean {
    return this.hp <= 0 && (!checkStatus || this.status?.effect === StatusEffect.FAINT);
  }

  /**
   * Check if this pokemon is both not fainted and allowed to be in battle based on currently active challenges.
   * @returns {boolean} `true` if pokemon is allowed in battle
   */
  public isAllowedInBattle(): boolean {
    return !this.isFainted() && this.isAllowedInChallenge();
  }

  /**
   * Check if this pokemon is allowed based on any active challenges.
   * It's usually better to call {@linkcode isAllowedInBattle()}
   * @returns {boolean} `true` if pokemon is allowed in battle
   */
  public isAllowedInChallenge(): boolean {
    const challengeAllowed = new Utils.BooleanHolder(true);
    applyChallenges(globalScene.gameMode, ChallengeType.POKEMON_IN_BATTLE, this, challengeAllowed);
    return challengeAllowed.value;
  }

  /**
   * Checks if the pokemon is allowed in battle (ie: not fainted, and allowed under any active challenges).
   * @param onField `true` to also check if the pokemon is currently on the field, defaults to `false`
   * @returns `true` if the pokemon is "active". Returns `false` if there is no active {@linkcode BattleScene}
   */
  public isActive(onField: boolean = false): boolean {
    if (!globalScene) {
      return false;
    }
    return this.isAllowedInBattle() && (!onField || this.isOnField());
  }

  getDexAttr(): bigint {
    let ret = 0n;
    ret |= this.gender !== Gender.FEMALE ? DexAttr.MALE : DexAttr.FEMALE;
    ret |= !this.shiny ? DexAttr.NON_SHINY : DexAttr.SHINY;
    ret |= this.variant >= 2 ? DexAttr.VARIANT_3 : this.variant === 1 ? DexAttr.VARIANT_2 : DexAttr.DEFAULT_VARIANT;
    ret |= globalScene.gameData.getFormAttr(this.formIndex);
    return ret;
  }

  /**
   * Sets the Pokemon's name. Only called when loading a Pokemon so this function needs to be called when
   * initializing hardcoded Pokemon or else it will not display the form index name properly.
   * @returns n/a
   */
  generateName(): void {
    if (!this.fusionSpecies) {
      this.name = this.species.getName(this.formIndex);
      return;
    }
    this.name = getFusedSpeciesName(this.species.getName(this.formIndex), this.fusionSpecies.getName(this.fusionFormIndex));
    if (this.battleInfo) {
      this.updateInfo(true);
    }
  }

  abstract isPlayer(): boolean;

  abstract hasTrainer(): boolean;

  abstract getFieldIndex(): number;

  abstract getBattlerIndex(): BattlerIndex;

  loadAssets(ignoreOverride: boolean = true): Promise<void> {
    return new Promise(resolve => {
      const moveIds = this.getMoveset().map(m => m!.getMove().id); // TODO: is this bang correct?
      Promise.allSettled(moveIds.map(m => initMoveAnim(m)))
        .then(() => {
          loadMoveAnimAssets(moveIds);
          this.getSpeciesForm().loadAssets(this.getGender() === Gender.FEMALE, this.formIndex, this.shiny, this.variant);
          if (this.isPlayer() || this.getFusionSpeciesForm()) {
            globalScene.loadPokemonAtlas(this.getBattleSpriteKey(true, ignoreOverride), this.getBattleSpriteAtlasPath(true, ignoreOverride));
          }
          if (this.getFusionSpeciesForm()) {
            this.getFusionSpeciesForm().loadAssets(this.getFusionGender() === Gender.FEMALE, this.fusionFormIndex, this.fusionShiny, this.fusionVariant);
            globalScene.loadPokemonAtlas(this.getFusionBattleSpriteKey(true, ignoreOverride), this.getFusionBattleSpriteAtlasPath(true, ignoreOverride));
          }
          globalScene.load.once(Phaser.Loader.Events.COMPLETE, () => {
            if (this.isPlayer()) {
              const originalWarn = console.warn;
              // Ignore warnings for missing frames, because there will be a lot
              console.warn = () => {};
              const battleFrameNames = globalScene.anims.generateFrameNames(this.getBattleSpriteKey(), { zeroPad: 4, suffix: ".png", start: 1, end: 400 });
              console.warn = originalWarn;
              if (!(globalScene.anims.exists(this.getBattleSpriteKey()))) {
                globalScene.anims.create({
                  key: this.getBattleSpriteKey(),
                  frames: battleFrameNames,
                  frameRate: 10,
                  repeat: -1
                });
              }
            }
            this.playAnim();
            const updateFusionPaletteAndResolve = () => {
              this.updateFusionPalette();
              if (this.summonData?.speciesForm) {
                this.updateFusionPalette(true);
              }
              resolve();
            };
            if (this.shiny) {
              const populateVariantColors = (isBackSprite: boolean = false): Promise<void> => {
                return new Promise(async resolve => {
                  const battleSpritePath = this.getBattleSpriteAtlasPath(isBackSprite, ignoreOverride).replace("variant/", "").replace(/_[1-3]$/, "");
                  let config = variantData;
                  const useExpSprite = globalScene.experimentalSprites && globalScene.hasExpSprite(this.getBattleSpriteKey(isBackSprite, ignoreOverride));
                  battleSpritePath.split("/").map(p => config ? config = config[p] : null);
                  const variantSet: VariantSet = config as VariantSet;
                  if (variantSet && variantSet[this.variant] === 1) {
                    const cacheKey = this.getBattleSpriteKey(isBackSprite);
                    if (!variantColorCache.hasOwnProperty(cacheKey)) {
                      await this.populateVariantColorCache(cacheKey, useExpSprite, battleSpritePath);
                    }
                  }
                  resolve();
                });
              };
              if (this.isPlayer()) {
                Promise.all([ populateVariantColors(false), populateVariantColors(true) ]).then(() => updateFusionPaletteAndResolve());
              } else {
                populateVariantColors(false).then(() => updateFusionPaletteAndResolve());
              }
            } else {
              updateFusionPaletteAndResolve();
            }
          });
          if (!globalScene.load.isLoading()) {
            globalScene.load.start();
          }
        });
    });
  }

  /**
   * Gracefully handle errors loading a variant sprite. Log if it fails and attempt to fall back on
   * non-experimental sprites before giving up.
   *
   * @param cacheKey the cache key for the variant color sprite
   * @param attemptedSpritePath the sprite path that failed to load
   * @param useExpSprite was the attempted sprite experimental
   * @param battleSpritePath the filename of the sprite
   * @param optionalParams any additional params to log
   */
  async fallbackVariantColor(cacheKey: string, attemptedSpritePath: string, useExpSprite: boolean, battleSpritePath: string, ...optionalParams: any[]) {
    console.warn(`Could not load ${attemptedSpritePath}!`, ...optionalParams);
    if (useExpSprite) {
      await this.populateVariantColorCache(cacheKey, false, battleSpritePath);
    }
  }

  /**
   * Attempt to process variant sprite.
   *
   * @param cacheKey the cache key for the variant color sprite
   * @param useExpSprite should the experimental sprite be used
   * @param battleSpritePath the filename of the sprite
   */
  async populateVariantColorCache(cacheKey: string, useExpSprite: boolean, battleSpritePath: string) {
    const spritePath = `./images/pokemon/variant/${useExpSprite ? "exp/" : ""}${battleSpritePath}.json`;
    return globalScene.cachedFetch(spritePath).then(res => {
      // Prevent the JSON from processing if it failed to load
      if (!res.ok) {
        return this.fallbackVariantColor(cacheKey, res.url, useExpSprite, battleSpritePath, res.status, res.statusText);
      }
      return res.json();
    }).catch(error => {
      return this.fallbackVariantColor(cacheKey, spritePath, useExpSprite, battleSpritePath, error);
    }).then(c => {
      if (!isNullOrUndefined(c)) {
        variantColorCache[cacheKey] = c;
      }
    });
  }

  getFormKey(): string {
    if (!this.species.forms.length || this.species.forms.length <= this.formIndex) {
      return "";
    }
    return this.species.forms[this.formIndex].formKey;
  }

  getFusionFormKey(): string | null {
    if (!this.fusionSpecies) {
      return null;
    }
    if (!this.fusionSpecies.forms.length || this.fusionSpecies.forms.length <= this.fusionFormIndex) {
      return "";
    }
    return this.fusionSpecies.forms[this.fusionFormIndex].formKey;
  }

  getSpriteAtlasPath(ignoreOverride?: boolean): string {
    const spriteId = this.getSpriteId(ignoreOverride).replace(/\_{2}/g, "/");
    return `${/_[1-3]$/.test(spriteId) ? "variant/" : ""}${spriteId}`;
  }

  getBattleSpriteAtlasPath(back?: boolean, ignoreOverride?: boolean): string {
    const spriteId = this.getBattleSpriteId(back, ignoreOverride).replace(/\_{2}/g, "/");
    return `${/_[1-3]$/.test(spriteId) ? "variant/" : ""}${spriteId}`;
  }

  getSpriteId(ignoreOverride?: boolean): string {
    return this.getSpeciesForm(ignoreOverride).getSpriteId(this.getGender(ignoreOverride) === Gender.FEMALE, this.formIndex, this.shiny, this.variant);
  }

  getBattleSpriteId(back?: boolean, ignoreOverride?: boolean): string {
    if (back === undefined) {
      back = this.isPlayer();
    }
    return this.getSpeciesForm(ignoreOverride).getSpriteId(this.getGender(ignoreOverride) === Gender.FEMALE, this.formIndex, this.shiny, this.variant, back);
  }

  getSpriteKey(ignoreOverride?: boolean): string {
    return this.getSpeciesForm(ignoreOverride).getSpriteKey(this.getGender(ignoreOverride) === Gender.FEMALE, this.formIndex, this.shiny, this.variant);
  }

  getBattleSpriteKey(back?: boolean, ignoreOverride?: boolean): string {
    return `pkmn__${this.getBattleSpriteId(back, ignoreOverride)}`;
  }

  getFusionSpriteId(ignoreOverride?: boolean): string {
    return this.getFusionSpeciesForm(ignoreOverride).getSpriteId(this.getFusionGender(ignoreOverride) === Gender.FEMALE, this.fusionFormIndex, this.fusionShiny, this.fusionVariant);
  }

  getFusionBattleSpriteId(back?: boolean, ignoreOverride?: boolean): string {
    if (back === undefined) {
      back = this.isPlayer();
    }
    return this.getFusionSpeciesForm(ignoreOverride).getSpriteId(this.getFusionGender(ignoreOverride) === Gender.FEMALE, this.fusionFormIndex, this.fusionShiny, this.fusionVariant, back);
  }

  getFusionBattleSpriteKey(back?: boolean, ignoreOverride?: boolean): string {
    return `pkmn__${this.getFusionBattleSpriteId(back, ignoreOverride)}`;
  }

  getFusionBattleSpriteAtlasPath(back?: boolean, ignoreOverride?: boolean): string {
    return this.getFusionBattleSpriteId(back, ignoreOverride).replace(/\_{2}/g, "/");
  }

  getIconAtlasKey(ignoreOverride?: boolean): string {
    return this.getSpeciesForm(ignoreOverride).getIconAtlasKey(this.formIndex, this.shiny, this.variant);
  }

  getFusionIconAtlasKey(ignoreOverride?: boolean): string {
    return this.getFusionSpeciesForm(ignoreOverride).getIconAtlasKey(this.fusionFormIndex, this.fusionShiny, this.fusionVariant);
  }

  getIconId(ignoreOverride?: boolean): string {
    return this.getSpeciesForm(ignoreOverride).getIconId(this.getGender(ignoreOverride) === Gender.FEMALE, this.formIndex, this.shiny, this.variant);
  }

  getFusionIconId(ignoreOverride?: boolean): string {
    return this.getFusionSpeciesForm(ignoreOverride).getIconId(this.getFusionGender(ignoreOverride) === Gender.FEMALE, this.fusionFormIndex, this.fusionShiny, this.fusionVariant);
  }

  getSpeciesForm(ignoreOverride?: boolean): PokemonSpeciesForm {
    if (!ignoreOverride && this.summonData?.speciesForm) {
      return this.summonData.speciesForm;
    }
    if (this.species.forms && this.species.forms.length > 0) {
      return this.species.forms[this.formIndex];
    }

    return this.species;
  }

  getFusionSpeciesForm(ignoreOverride?: boolean): PokemonSpeciesForm {
    if (!ignoreOverride && this.summonData?.speciesForm) {
      return this.summonData.fusionSpeciesForm;
    }
    if (!this.fusionSpecies?.forms?.length || this.fusionFormIndex >= this.fusionSpecies?.forms.length) {
      //@ts-ignore
      return this.fusionSpecies; // TODO: I don't even know how to fix this... A complete cluster of classes involved + null
    }
    return this.fusionSpecies?.forms[this.fusionFormIndex];
  }

  getSprite(): Phaser.GameObjects.Sprite {
    return this.getAt(0) as Phaser.GameObjects.Sprite;
  }

  getTintSprite(): Phaser.GameObjects.Sprite | null {
    return !this.maskEnabled
      ? this.getAt(1) as Phaser.GameObjects.Sprite
      : this.maskSprite;
  }

  getSpriteScale(): number {
    const formKey = this.getFormKey();
    if (this.isMax() === true || formKey === "segin-starmobile" || formKey === "schedar-starmobile" || formKey === "navi-starmobile" || formKey === "ruchbah-starmobile" || formKey === "caph-starmobile") {
      return 1.5;
    } else if (this.customPokemonData.spriteScale > 0) {
      return this.customPokemonData.spriteScale;
    }
    return 1;
  }

  /** Resets the pokemon's field sprite properties, including position, alpha, and scale */
  resetSprite(): void {
    // Resetting properties should not be shown on the field
    this.setVisible(false);

    // Remove the offset from having a Substitute active
    if (this.isOffsetBySubstitute()) {
      this.x -= this.getSubstituteOffset()[0];
      this.y -= this.getSubstituteOffset()[1];
    }

    // Reset sprite display properties
    this.setAlpha(1);
    this.setScale(this.getSpriteScale());
  }

  getHeldItems(): PokemonHeldItemModifier[] {
    if (!globalScene) {
      return [];
    }
    return globalScene.findModifiers(m => m instanceof PokemonHeldItemModifier && m.pokemonId === this.id, this.isPlayer()) as PokemonHeldItemModifier[];
  }

  updateScale(): void {
    this.setScale(this.getSpriteScale());
  }

  updateSpritePipelineData(): void {
    [ this.getSprite(), this.getTintSprite() ].filter(s => !!s).map(s => {
      s.pipelineData["teraColor"] = getTypeRgb(this.getTeraType());
      s.pipelineData["isTerastallized"] = this.isTerastallized;
    });
    this.updateInfo(true);
  }

  initShinySparkle(): void {
    const shinySparkle = globalScene.addFieldSprite(0, 0, "shiny");
    shinySparkle.setVisible(false);
    shinySparkle.setOrigin(0.5, 1);
    this.add(shinySparkle);

    this.shinySparkle = shinySparkle;
  }

  /**
   * Attempts to animate a given {@linkcode Phaser.GameObjects.Sprite}
   * @see {@linkcode Phaser.GameObjects.Sprite.play}
   * @param sprite {@linkcode Phaser.GameObjects.Sprite} to animate
   * @param tintSprite {@linkcode Phaser.GameObjects.Sprite} placed on top of the sprite to add a color tint
   * @param animConfig {@linkcode String} to pass to {@linkcode Phaser.GameObjects.Sprite.play}
   * @returns true if the sprite was able to be animated
   */
  tryPlaySprite(sprite: Phaser.GameObjects.Sprite, tintSprite: Phaser.GameObjects.Sprite, key: string): boolean {
    // Catch errors when trying to play an animation that doesn't exist
    try {
      sprite.play(key);
      tintSprite.play(key);
    } catch (error: unknown) {
      console.error(`Couldn't play animation for '${key}'!\nIs the image for this Pokemon missing?\n`, error);

      return false;
    }

    return true;
  }

  playAnim(): void {
    this.tryPlaySprite(this.getSprite(), this.getTintSprite()!, this.getBattleSpriteKey()); // TODO: is the bag correct?
  }

  getFieldPositionOffset(): [ number, number ] {
    switch (this.fieldPosition) {
      case FieldPosition.CENTER:
        return [ 0, 0 ];
      case FieldPosition.LEFT:
        return [ -32, -8 ];
      case FieldPosition.RIGHT:
        return [ 32, 0 ];
    }
  }

  /**
   * Returns the Pokemon's offset from its current field position in the event that
   * it has a Substitute doll in effect. The offset is returned in `[ x, y ]` format.
   * @see {@linkcode SubstituteTag}
   * @see {@linkcode getFieldPositionOffset}
   */
  getSubstituteOffset(): [ number, number ] {
    return this.isPlayer() ? [ -30, 10 ] : [ 30, -10 ];
  }

  /**
   * Returns whether or not the Pokemon's position on the field is offset because
   * the Pokemon has a Substitute active.
   * @see {@linkcode SubstituteTag}
   */
  isOffsetBySubstitute(): boolean {
    const substitute = this.getTag(SubstituteTag);
    if (substitute) {
      if (substitute.sprite === undefined) {
        return false;
      }

      // During the Pokemon's MoveEffect phase, the offset is removed to put the Pokemon "in focus"
      const currentPhase = globalScene.getCurrentPhase();
      if (currentPhase instanceof MoveEffectPhase && currentPhase.getPokemon() === this) {
        return false;
      }
      return true;
    } else {
      return false;
    }
  }

  /** If this Pokemon has a Substitute on the field, removes its sprite from the field. */
  destroySubstitute(): void {
    const substitute = this.getTag(SubstituteTag);
    if (substitute && substitute.sprite) {
      substitute.sprite.destroy();
    }
  }

  setFieldPosition(fieldPosition: FieldPosition, duration?: number): Promise<void> {
    return new Promise(resolve => {
      if (fieldPosition === this.fieldPosition) {
        resolve();
        return;
      }

      const initialOffset = this.getFieldPositionOffset();

      this.fieldPosition = fieldPosition;

      this.battleInfo.setMini(fieldPosition !== FieldPosition.CENTER);
      this.battleInfo.setOffset(fieldPosition === FieldPosition.RIGHT);

      const newOffset = this.getFieldPositionOffset();

      const relX = newOffset[0] - initialOffset[0];
      const relY = newOffset[1] - initialOffset[1];

      const subTag = this.getTag(SubstituteTag);

      if (duration) {
        // TODO: can this use stricter typing?
        const targets: any[] = [ this ];
        if (subTag?.sprite) {
          targets.push(subTag.sprite);
        }
        globalScene.tweens.add({
          targets: targets,
          x: (_target, _key, value: number) => value + relX,
          y: (_target, _key, value: number) => value + relY,
          duration: duration,
          ease: "Sine.easeOut",
          onComplete: () => resolve()
        });
      } else {
        this.x += relX;
        this.y += relY;
        if (subTag?.sprite) {
          subTag.sprite.x += relX;
          subTag.sprite.y += relY;
        }
      }
    });
  }

  /**
   * Retrieves the entire set of stats of the {@linkcode Pokemon}.
   * @param bypassSummonData prefer actual stats (`true` by default) or in-battle overriden stats (`false`)
   * @returns the numeric values of the {@linkcode Pokemon}'s stats
   */
  getStats(bypassSummonData: boolean = true): number[] {
    if (!bypassSummonData && this.summonData?.stats) {
      return this.summonData.stats;
    }
    return this.stats;
  }

  /**
   * Retrieves the corresponding {@linkcode PermanentStat} of the {@linkcode Pokemon}.
   * @param stat the desired {@linkcode PermanentStat}
   * @param bypassSummonData prefer actual stats (`true` by default) or in-battle overridden stats (`false`)
   * @returns the numeric value of the desired {@linkcode Stat}
   */
  getStat(stat: PermanentStat, bypassSummonData: boolean = true): number {
    if (!bypassSummonData && this.summonData && (this.summonData.stats[stat] !== 0)) {
      return this.summonData.stats[stat];
    }
    return this.stats[stat];
  }

  /**
   * Writes the value to the corrseponding {@linkcode PermanentStat} of the {@linkcode Pokemon}.
   *
   * Note that this does nothing if {@linkcode value} is less than 0.
   * @param stat the desired {@linkcode PermanentStat} to be overwritten
   * @param value the desired numeric value
   * @param bypassSummonData write to actual stats (`true` by default) or in-battle overridden stats (`false`)
   */
  setStat(stat: PermanentStat, value: number, bypassSummonData: boolean = true): void {
    if (value >= 0) {
      if (!bypassSummonData && this.summonData) {
        this.summonData.stats[stat] = value;
      } else {
        this.stats[stat] = value;
      }
    }
  }

  /**
   * Retrieves the entire set of in-battle stat stages of the {@linkcode Pokemon}.
   * @returns the numeric values of the {@linkcode Pokemon}'s in-battle stat stages if available, a fresh stat stage array otherwise
   */
  getStatStages(): number[] {
    return this.summonData ? this.summonData.statStages : [ 0, 0, 0, 0, 0, 0, 0 ];
  }

  /**
   * Retrieves the in-battle stage of the specified {@linkcode BattleStat}.
   * @param stat the {@linkcode BattleStat} whose stage is desired
   * @returns the stage of the desired {@linkcode BattleStat} if available, 0 otherwise
   */
  getStatStage(stat: BattleStat): number {
    return this.summonData ? this.summonData.statStages[stat - 1] : 0;
  }

  /**
   * Writes the value to the in-battle stage of the corresponding {@linkcode BattleStat} of the {@linkcode Pokemon}.
   *
   * Note that, if the value is not within a range of [-6, 6], it will be forced to the closest range bound.
   * @param stat the {@linkcode BattleStat} whose stage is to be overwritten
   * @param value the desired numeric value
   */
  setStatStage(stat: BattleStat, value: number): void {
    if (this.summonData) {
      if (value >= -6) {
        this.summonData.statStages[stat - 1] = Math.min(value, 6);
      } else {
        this.summonData.statStages[stat - 1] = Math.max(value, -6);
      }
    }
  }

  /**
   * Retrieves the critical-hit stage considering the move used and the Pokemon
   * who used it.
   * @param source the {@linkcode Pokemon} who using the move
   * @param move the {@linkcode Move} being used
   * @returns the final critical-hit stage value
   */
  getCritStage(source: Pokemon, move: Move): number {
    const critStage = new Utils.NumberHolder(0);
    applyMoveAttrs(HighCritAttr, source, this, move, critStage);
    globalScene.applyModifiers(CritBoosterModifier, source.isPlayer(), source, critStage);
    globalScene.applyModifiers(TempCritBoosterModifier, source.isPlayer(), critStage);
    const bonusCrit = new Utils.BooleanHolder(false);
    //@ts-ignore
    if (applyAbAttrs(BonusCritAbAttr, source, null, false, bonusCrit)) { // TODO: resolve ts-ignore. This is a promise. Checking a promise is bogus.
      if (bonusCrit.value) {
        critStage.value += 1;
      }
    }
    const critBoostTag = source.getTag(CritBoostTag);
    if (critBoostTag) {
      if (critBoostTag instanceof DragonCheerTag) {
        critStage.value += critBoostTag.typesOnAdd.includes(Type.DRAGON) ? 2 : 1;
      } else {
        critStage.value += 2;
      }
    }

    console.log(`crit stage: +${critStage.value}`);
    return critStage.value;
  }

  /**
   * Calculates and retrieves the final value of a stat considering any held
   * items, move effects, opponent abilities, and whether there was a critical
   * hit.
   * @param stat the desired {@linkcode EffectiveStat}
   * @param opponent the target {@linkcode Pokemon}
   * @param move the {@linkcode Move} being used
   * @param ignoreAbility determines whether this Pokemon's abilities should be ignored during the stat calculation
   * @param ignoreOppAbility during an attack, determines whether the opposing Pokemon's abilities should be ignored during the stat calculation.
   * @param isCritical determines whether a critical hit has occurred or not (`false` by default)
   * @param simulated if `true`, nullifies any effects that produce any changes to game state from triggering
   * @param ignoreHeldItems determines whether this Pokemon's held items should be ignored during the stat calculation, default `false`
   * @returns the final in-battle value of a stat
   */
  getEffectiveStat(stat: EffectiveStat, opponent?: Pokemon, move?: Move, ignoreAbility: boolean = false, ignoreOppAbility: boolean = false, isCritical: boolean = false, simulated: boolean = true, ignoreHeldItems: boolean = false): number {
    const statValue = new Utils.NumberHolder(this.getStat(stat, false));
    if (!ignoreHeldItems) {
      globalScene.applyModifiers(StatBoosterModifier, this.isPlayer(), this, stat, statValue);
    }

    // The Ruin abilities here are never ignored, but they reveal themselves on summon anyway
    const fieldApplied = new Utils.BooleanHolder(false);
    for (const pokemon of globalScene.getField(true)) {
      applyFieldStatMultiplierAbAttrs(FieldMultiplyStatAbAttr, pokemon, stat, statValue, this, fieldApplied, simulated);
      if (fieldApplied.value) {
        break;
      }
    }
    if (!ignoreAbility) {
      applyStatMultiplierAbAttrs(StatMultiplierAbAttr, this, stat, statValue, simulated);
    }

    let ret = statValue.value * this.getStatStageMultiplier(stat, opponent, move, ignoreOppAbility, isCritical, simulated, ignoreHeldItems);

    switch (stat) {
      case Stat.ATK:
        if (this.getTag(BattlerTagType.SLOW_START)) {
          ret >>= 1;
        }
        break;
      case Stat.DEF:
        if (this.isOfType(Type.ICE) && globalScene.arena.weather?.weatherType === WeatherType.SNOW) {
          ret *= 1.5;
        }
        break;
      case Stat.SPATK:
        break;
      case Stat.SPDEF:
        if (this.isOfType(Type.ROCK) && globalScene.arena.weather?.weatherType === WeatherType.SANDSTORM) {
          ret *= 1.5;
        }
        break;
      case Stat.SPD:
        const side = this.isPlayer() ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY;
        if (globalScene.arena.getTagOnSide(ArenaTagType.TAILWIND, side)) {
          ret *= 2;
        }
        if (globalScene.arena.getTagOnSide(ArenaTagType.GRASS_WATER_PLEDGE, side)) {
          ret >>= 2;
        }

        if (this.getTag(BattlerTagType.SLOW_START)) {
          ret >>= 1;
        }
        if (this.status && this.status.effect === StatusEffect.PARALYSIS) {
          ret >>= 1;
        }
        if (this.getTag(BattlerTagType.UNBURDEN) && this.hasAbility(Abilities.UNBURDEN)) {
          ret *= 2;
        }
        break;
    }

    const highestStatBoost = this.findTag(t => t instanceof HighestStatBoostTag && (t as HighestStatBoostTag).stat === stat) as HighestStatBoostTag;
    if (highestStatBoost) {
      ret *= highestStatBoost.multiplier;
    }

    return Math.floor(ret);
  }

  calculateStats(): void {
    if (!this.stats) {
      this.stats = [ 0, 0, 0, 0, 0, 0 ];
    }

    // Get and manipulate base stats
    const baseStats = this.calculateBaseStats();
    // Using base stats, calculate and store stats one by one
    for (const s of PERMANENT_STATS) {
      const statHolder = new Utils.NumberHolder(Math.floor(((2 * baseStats[s] + this.ivs[s]) * this.level) * 0.01));
      if (s === Stat.HP) {
        statHolder.value = statHolder.value + this.level + 10;
        globalScene.applyModifier(PokemonIncrementingStatModifier, this.isPlayer(), this, s, statHolder);
        if (this.hasAbility(Abilities.WONDER_GUARD, false, true)) {
          statHolder.value = 1;
        }
        if (this.hp > statHolder.value || this.hp === undefined) {
          this.hp = statHolder.value;
        } else if (this.hp) {
          const lastMaxHp = this.getMaxHp();
          if (lastMaxHp && statHolder.value > lastMaxHp) {
            this.hp += statHolder.value - lastMaxHp;
          }
        }
      } else {
        statHolder.value += 5;
        const natureStatMultiplier = new Utils.NumberHolder(getNatureStatMultiplier(this.getNature(), s));
        globalScene.applyModifier(PokemonNatureWeightModifier, this.isPlayer(), this, natureStatMultiplier);
        if (natureStatMultiplier.value !== 1) {
          statHolder.value = Math.max(Math[natureStatMultiplier.value > 1 ? "ceil" : "floor"](statHolder.value * natureStatMultiplier.value), 1);
        }
        globalScene.applyModifier(PokemonIncrementingStatModifier, this.isPlayer(), this, s, statHolder);
      }

      statHolder.value = Phaser.Math.Clamp(statHolder.value, 1, Number.MAX_SAFE_INTEGER);

      this.setStat(s, statHolder.value);
    }
  }

  calculateBaseStats(): number[] {
    const baseStats = this.getSpeciesForm(true).baseStats.slice(0);
    applyChallenges(globalScene.gameMode, ChallengeType.FLIP_STAT, this, baseStats);
    // Shuckle Juice
    globalScene.applyModifiers(PokemonBaseStatTotalModifier, this.isPlayer(), this, baseStats);
    // Old Gateau
    globalScene.applyModifiers(PokemonBaseStatFlatModifier, this.isPlayer(), this, baseStats);
    if (this.isFusion()) {
      const fusionBaseStats = this.getFusionSpeciesForm(true).baseStats;
      applyChallenges(globalScene.gameMode, ChallengeType.FLIP_STAT, this, fusionBaseStats);

      for (const s of PERMANENT_STATS) {
        baseStats[s] = Math.ceil((baseStats[s] + fusionBaseStats[s]) / 2);
      }
    } else if (globalScene.gameMode.isSplicedOnly) {
      for (const s of PERMANENT_STATS) {
        baseStats[s] = Math.ceil(baseStats[s] / 2);
      }
    }
    // Vitamins
    globalScene.applyModifiers(BaseStatModifier, this.isPlayer(), this, baseStats);

    return baseStats;
  }

  getNature(): Nature {
    return this.customPokemonData.nature !== -1 ? this.customPokemonData.nature : this.nature;
  }

  setNature(nature: Nature): void {
    this.nature = nature;
    this.calculateStats();
  }

  setCustomNature(nature: Nature): void {
    this.customPokemonData.nature = nature;
    this.calculateStats();
  }

  generateNature(naturePool?: Nature[]): void {
    if (naturePool === undefined) {
      naturePool = Utils.getEnumValues(Nature);
    }
    const nature = naturePool[Utils.randSeedInt(naturePool.length)];
    this.setNature(nature);
  }

  isFullHp(): boolean {
    return this.hp >= this.getMaxHp();
  }

  getMaxHp(): number {
    return this.getStat(Stat.HP);
  }

  /** Returns the amount of hp currently missing from this {@linkcode Pokemon} (max - current) */
  getInverseHp(): number {
    return this.getMaxHp() - this.hp;
  }

  getHpRatio(precise: boolean = false): number {
    return precise
      ? this.hp / this.getMaxHp()
      : Math.round((this.hp / this.getMaxHp()) * 100) / 100;
  }

  generateGender(): void {
    if (this.species.malePercent === null) {
      this.gender = Gender.GENDERLESS;
    } else {
      const genderChance = (this.id % 256) * 0.390625;
      if (genderChance < this.species.malePercent) {
        this.gender = Gender.MALE;
      } else {
        this.gender = Gender.FEMALE;
      }
    }
  }

  getGender(ignoreOverride?: boolean): Gender {
    if (!ignoreOverride && this.summonData?.gender !== undefined) {
      return this.summonData.gender;
    }
    return this.gender;
  }

  getFusionGender(ignoreOverride?: boolean): Gender {
    if (!ignoreOverride && this.summonData?.fusionGender !== undefined) {
      return this.summonData.fusionGender;
    }
    return this.fusionGender;
  }

  isShiny(): boolean {
    return this.shiny || (this.isFusion() && this.fusionShiny);
  }

  getVariant(): Variant {
    return !this.isFusion() ? this.variant : Math.max(this.variant, this.fusionVariant) as Variant;
  }

  getLuck(): number {
    return this.luck + (this.isFusion() ? this.fusionLuck : 0);
  }

  isFusion(): boolean {
    return !!this.fusionSpecies;
  }

  /**
   * Checks if the {@linkcode Pokemon} has a fusion with the specified {@linkcode Species}.
   * @param species the pokemon {@linkcode Species} to check
   * @returns `true` if the {@linkcode Pokemon} has a fusion with the specified {@linkcode Species}, `false` otherwise
   */
  hasFusionSpecies(species: Species): boolean {
    return this.fusionSpecies?.speciesId === species;
  }

  /**
   * Checks if the {@linkcode Pokemon} has is the specified {@linkcode Species} or is fused with it.
   * @param species the pokemon {@linkcode Species} to check
   * @returns `true` if the pokemon is the species or is fused with it, `false` otherwise
   */
  hasSpecies(species: Species): boolean {
    return this.species.speciesId === species || this.fusionSpecies?.speciesId === species;
  }

  abstract isBoss(): boolean;

  getMoveset(ignoreOverride?: boolean): (PokemonMove | null)[] {
    const ret = !ignoreOverride && this.summonData?.moveset
      ? this.summonData.moveset
      : this.moveset;

    // Overrides moveset based on arrays specified in overrides.ts
    let overrideArray: Moves | Array<Moves> = this.isPlayer() ? Overrides.MOVESET_OVERRIDE : Overrides.OPP_MOVESET_OVERRIDE;
    if (!Array.isArray(overrideArray)) {
      overrideArray = [ overrideArray ];
    }
    if (overrideArray.length > 0) {
      if (!this.isPlayer()) {
        this.moveset = [];
      }
      overrideArray.forEach((move: Moves, index: number) => {
        const ppUsed = this.moveset[index]?.ppUsed ?? 0;
        this.moveset[index] = new PokemonMove(move, Math.min(ppUsed, allMoves[move].pp));
      });
    }

    return ret;
  }

  /**
   * Checks which egg moves have been unlocked for the {@linkcode Pokemon} based
   * on the species it was met at or by the first {@linkcode Pokemon} in its evolution
   * line that can act as a starter and provides those egg moves.
   * @returns an array of {@linkcode Moves}, the length of which is determined by how many
   * egg moves are unlocked for that species.
   */
  getUnlockedEggMoves(): Moves[] {
    const moves: Moves[] = [];
    const species = this.metSpecies in speciesEggMoves ? this.metSpecies : this.getSpeciesForm(true).getRootSpeciesId(true);
    if (species in speciesEggMoves) {
      for (let i = 0; i < 4; i++) {
        if (globalScene.gameData.starterData[species].eggMoves & (1 << i)) {
          moves.push(speciesEggMoves[species][i]);
        }
      }
    }
    return moves;
  }

  /**
   * Gets all possible learnable level moves for the {@linkcode Pokemon},
   * excluding any moves already known.
   *
   * Available egg moves are only included if the {@linkcode Pokemon} was
   * in the starting party of the run and if Fresh Start is not active.
   * @returns an array of {@linkcode Moves}, the length of which is determined
   * by how many learnable moves there are for the {@linkcode Pokemon}.
   */
  public getLearnableLevelMoves(): Moves[] {
    let levelMoves = this.getLevelMoves(1, true, false, true).map(lm => lm[1]);
    if (this.metBiome === -1 && !globalScene.gameMode.isFreshStartChallenge() && !globalScene.gameMode.isDaily) {
      levelMoves = this.getUnlockedEggMoves().concat(levelMoves);
    }
    if (Array.isArray(this.usedTMs) && this.usedTMs.length > 0) {
      levelMoves = this.usedTMs.filter(m => !levelMoves.includes(m)).concat(levelMoves);
    }
    levelMoves = levelMoves.filter(lm => !this.moveset.some(m => m?.moveId === lm));
    return levelMoves;
  }

  /**
   * Gets the types of a pokemon
   * @param includeTeraType - `true` to include tera-formed type; Default: `false`
   * @param forDefend - `true` if the pokemon is defending from an attack; Default: `false`
   * @param ignoreOverride - If `true`, ignore ability changing effects; Default: `false`
   * @returns array of {@linkcode Type}
   */
  public getTypes(includeTeraType = false, forDefend: boolean = false, ignoreOverride: boolean = false): Type[] {
    const types: Type[] = [];

    if (includeTeraType && this.isTerastallized) {
      const teraType = this.getTeraType();
      if (this.isTerastallized && !(forDefend && teraType === Type.STELLAR)) { // Stellar tera uses its original types defensively
        types.push(teraType);
        if (forDefend) {
          return types;
        }
      }
    }

    if (!types.length || !includeTeraType) {
      if (!ignoreOverride && this.summonData?.types && this.summonData.types.length > 0) {
        this.summonData.types.forEach(t => types.push(t));
      } else {
        const speciesForm = this.getSpeciesForm(ignoreOverride);
        const fusionSpeciesForm = this.getFusionSpeciesForm(ignoreOverride);
        const customTypes = this.customPokemonData.types?.length > 0;

        // First type, checking for "permanently changed" types from ME
        const firstType = (customTypes && this.customPokemonData.types[0] !== Type.UNKNOWN) ? this.customPokemonData.types[0] : speciesForm.type1;
        types.push(firstType);

        // Second type
        let secondType: Type = Type.UNKNOWN;

        if (fusionSpeciesForm) {
          // Check if the fusion Pokemon also has permanent changes from ME when determining the fusion types
          const fusionType1 = (this.fusionCustomPokemonData?.types && this.fusionCustomPokemonData.types.length > 0 && this.fusionCustomPokemonData.types[0] !== Type.UNKNOWN)
            ? this.fusionCustomPokemonData.types[0] : fusionSpeciesForm.type1;
          const fusionType2 = (this.fusionCustomPokemonData?.types && this.fusionCustomPokemonData.types.length > 1 && this.fusionCustomPokemonData.types[1] !== Type.UNKNOWN)
            ? this.fusionCustomPokemonData.types[1] : fusionSpeciesForm.type2;

          // Assign second type if the fusion can provide one
          if (fusionType2 !== null && fusionType2 !== types[0]) {
            secondType = fusionType2;
          } else if (fusionType1 !== types[0]) {
            secondType = fusionType1;
          }


          if (secondType === Type.UNKNOWN && Utils.isNullOrUndefined(fusionType2)) { // If second pokemon was monotype and shared its primary type
            secondType = (customTypes && this.customPokemonData.types.length > 1 && this.customPokemonData.types[1] !== Type.UNKNOWN)
              ? this.customPokemonData.types[1] : (speciesForm.type2 ?? Type.UNKNOWN);
          }
        } else {
          // If not a fusion, just get the second type from the species, checking for permanent changes from ME
          secondType = (customTypes && this.customPokemonData.types.length > 1 && this.customPokemonData.types[1] !== Type.UNKNOWN)
            ? this.customPokemonData.types[1] : (speciesForm.type2 ?? Type.UNKNOWN);
        }

        if (secondType !== Type.UNKNOWN) {
          types.push(secondType);
        }
      }
    }

    // become UNKNOWN if no types are present
    if (!types.length) {
      types.push(Type.UNKNOWN);
    }

    // remove UNKNOWN if other types are present
    if (types.length > 1 && types.includes(Type.UNKNOWN)) {
      const index = types.indexOf(Type.UNKNOWN);
      if (index !== -1) {
        types.splice(index, 1);
      }
    }

    // the type added to Pokemon from moves like Forest's Curse or Trick Or Treat
    if (!ignoreOverride && this.summonData && this.summonData.addedType && !types.includes(this.summonData.addedType)) {
      types.push(this.summonData.addedType);
    }

    // If both types are the same (can happen in weird custom typing scenarios), reduce to single type
    if (types.length > 1 && types[0] === types[1]) {
      types.splice(0, 1);
    }

    return types;
  }

  /**
   * Checks if the pokemon's typing includes the specified type
   * @param type - {@linkcode Type} to check
   * @param includeTeraType - `true` to include tera-formed type; Default: `true`
   * @param forDefend - `true` if the pokemon is defending from an attack; Default: `false`
   * @param ignoreOverride - If `true`, ignore ability changing effects; Default: `false`
   * @returns `true` if the Pokemon's type matches
   */
  public isOfType(type: Type, includeTeraType: boolean = true, forDefend: boolean = false, ignoreOverride: boolean = false): boolean {
    return this.getTypes(includeTeraType, forDefend, ignoreOverride).some((t) => t === type);
  }

  /**
   * Gets the non-passive ability of the pokemon. This accounts for fusions and ability changing effects.
   * This should rarely be called, most of the time {@linkcode hasAbility} or {@linkcode hasAbilityWithAttr} are better used as
   * those check both the passive and non-passive abilities and account for ability suppression.
   * @see {@linkcode hasAbility} {@linkcode hasAbilityWithAttr} Intended ways to check abilities in most cases
   * @param ignoreOverride - If `true`, ignore ability changing effects; Default: `false`
   * @returns The non-passive {@linkcode Ability} of the pokemon
   */
  public getAbility(ignoreOverride: boolean = false): Ability {
    if (!ignoreOverride && this.summonData?.ability) {
      return allAbilities[this.summonData.ability];
    }
    if (Overrides.ABILITY_OVERRIDE && this.isPlayer()) {
      return allAbilities[Overrides.ABILITY_OVERRIDE];
    }
    if (Overrides.OPP_ABILITY_OVERRIDE && !this.isPlayer()) {
      return allAbilities[Overrides.OPP_ABILITY_OVERRIDE];
    }
    if (this.isFusion()) {
      if (!isNullOrUndefined(this.fusionCustomPokemonData?.ability) && this.fusionCustomPokemonData.ability !== -1) {
        return allAbilities[this.fusionCustomPokemonData.ability];
      } else {
        return allAbilities[this.getFusionSpeciesForm(ignoreOverride).getAbility(this.fusionAbilityIndex)];
      }
    }
    if (!isNullOrUndefined(this.customPokemonData.ability) && this.customPokemonData.ability !== -1) {
      return allAbilities[this.customPokemonData.ability];
    }
    let abilityId = this.getSpeciesForm(ignoreOverride).getAbility(this.abilityIndex);
    if (abilityId === Abilities.NONE) {
      abilityId = this.species.ability1;
    }
    return allAbilities[abilityId];
  }

  /**
   * Gets the passive ability of the pokemon. This should rarely be called, most of the time
   * {@linkcode hasAbility} or {@linkcode hasAbilityWithAttr} are better used as those check both the passive and
   * non-passive abilities and account for ability suppression.
   * @see {@linkcode hasAbility} {@linkcode hasAbilityWithAttr} Intended ways to check abilities in most cases
   * @returns The passive {@linkcode Ability} of the pokemon
   */
  public getPassiveAbility(): Ability {
    if (Overrides.PASSIVE_ABILITY_OVERRIDE && this.isPlayer()) {
      return allAbilities[Overrides.PASSIVE_ABILITY_OVERRIDE];
    }
    if (Overrides.OPP_PASSIVE_ABILITY_OVERRIDE && !this.isPlayer()) {
      return allAbilities[Overrides.OPP_PASSIVE_ABILITY_OVERRIDE];
    }
    if (!isNullOrUndefined(this.customPokemonData.passive) && this.customPokemonData.passive !== -1) {
      return allAbilities[this.customPokemonData.passive];
    }

    return allAbilities[this.species.getPassiveAbility(this.formIndex)];
  }

  /**
   * Gets a list of all instances of a given ability attribute among abilities this pokemon has.
   * Accounts for all the various effects which can affect whether an ability will be present or
   * in effect, and both passive and non-passive.
   * @param attrType - {@linkcode AbAttr} The ability attribute to check for.
   * @param canApply - If `false`, it doesn't check whether the ability is currently active; Default `true`
   * @param ignoreOverride - If `true`, it ignores ability changing effects; Default `false`
   * @returns An array of all the ability attributes on this ability.
   */
  public getAbilityAttrs<T extends AbAttr = AbAttr>(attrType: { new(...args: any[]): T }, canApply: boolean = true, ignoreOverride: boolean = false): T[] {
    const abilityAttrs: T[] = [];

    if (!canApply || this.canApplyAbility()) {
      abilityAttrs.push(...this.getAbility(ignoreOverride).getAttrs<T>(attrType));
    }

    if (!canApply || this.canApplyAbility(true)) {
      abilityAttrs.push(...this.getPassiveAbility().getAttrs(attrType));
    }

    return abilityAttrs;
  }

  /**
   * Sets the {@linkcode Pokemon}'s ability and activates it if it normally activates on summon
   *
   * Also clears primal weather if it is from the ability being changed
   * @param ability New Ability
   */
  public setTempAbility(ability: Ability, passive: boolean = false): void {
    applyOnLoseAbAttrs(this, passive);
    if (passive) {
      this.summonData.passiveAbility = ability.id;
    } else {
      this.summonData.ability = ability.id;
    }
    applyOnGainAbAttrs(this, passive);
  }

  /**
   * Suppresses an ability and calls its onlose attributes
   */
  public suppressAbility() {
    this.summonData.abilitySuppressed = true;
    [ true, false ].forEach((passive) => applyOnLoseAbAttrs(this, passive));
  }

  /**
   * Checks if a pokemon has a passive either from:
   *  - bought with starter candy
   *  - set by override
   *  - is a boss pokemon
   * @returns `true` if the Pokemon has a passive
   */
  public hasPassive(): boolean {
    // returns override if valid for current case
    if (
      (Overrides.HAS_PASSIVE_ABILITY_OVERRIDE === false && this.isPlayer())
      || (Overrides.OPP_HAS_PASSIVE_ABILITY_OVERRIDE === false && !this.isPlayer())
    ) {
      return false;
    }
    if (
      ((Overrides.PASSIVE_ABILITY_OVERRIDE !== Abilities.NONE || Overrides.HAS_PASSIVE_ABILITY_OVERRIDE) && this.isPlayer())
      || ((Overrides.OPP_PASSIVE_ABILITY_OVERRIDE !== Abilities.NONE || Overrides.OPP_HAS_PASSIVE_ABILITY_OVERRIDE) && !this.isPlayer())
    ) {
      return true;
    }

    // Classic Final boss and Endless Minor/Major bosses do not have passive
    const { currentBattle, gameMode } = globalScene;
    const waveIndex = currentBattle?.waveIndex;
    if (this instanceof EnemyPokemon &&
      (currentBattle?.battleSpec === BattleSpec.FINAL_BOSS ||
      gameMode.isEndlessMinorBoss(waveIndex) ||
      gameMode.isEndlessMajorBoss(waveIndex))) {
      return false;
    }

    return this.passive || this.isBoss();
  }

  /**
   * Checks whether an ability of a pokemon can be currently applied. This should rarely be
   * directly called, as {@linkcode hasAbility} and {@linkcode hasAbilityWithAttr} already call this.
   * @see {@linkcode hasAbility} {@linkcode hasAbilityWithAttr} Intended ways to check abilities in most cases
   * @param passive If true, check if passive can be applied instead of non-passive
   * @returns `true` if the ability can be applied
   */
  public canApplyAbility(passive: boolean = false): boolean {
    if (passive && !this.hasPassive()) {
      return false;
    }
    const ability = (!passive ? this.getAbility() : this.getPassiveAbility());
    if (this.isFusion() && ability.hasAttr(NoFusionAbilityAbAttr)) {
      return false;
    }
    const arena = globalScene?.arena;
    if (arena.ignoreAbilities && arena.ignoringEffectSource !== this.getBattlerIndex() && ability.isIgnorable) {
      return false;
    }
    if (this.summonData?.abilitySuppressed && !ability.hasAttr(UnsuppressableAbilityAbAttr)) {
      return false;
    }
    const suppressAbilitiesTag = arena.getTag(ArenaTagType.NEUTRALIZING_GAS) as SuppressAbilitiesTag;
    if (this.isOnField() && suppressAbilitiesTag) {
      const thisAbilitySuppressing = ability.hasAttr(PreLeaveFieldRemoveSuppressAbilitiesSourceAbAttr);
      const hasSuppressingAbility = this.hasAbilityWithAttr(PreLeaveFieldRemoveSuppressAbilitiesSourceAbAttr, false);
      // Neutralizing gas is up - suppress abilities unless they are unsuppressable or this pokemon is responsible for the gas
      // (Balance decided that the other ability of a neutralizing gas pokemon should not be neutralized)
      // If the ability itself is neutralizing gas, don't suppress it (handled through arena tag)
      const unsuppressable = ability.hasAttr(UnsuppressableAbilityAbAttr) || thisAbilitySuppressing || (hasSuppressingAbility && !suppressAbilitiesTag.shouldApplyToSelf());
      if (!unsuppressable) {
        return false;
      }
    }
    return (this.hp > 0 || ability.isBypassFaint) && !ability.conditions.find(condition => !condition(this));
  }

  /**
   * Checks whether a pokemon has the specified ability and it's in effect. Accounts for all the various
   * effects which can affect whether an ability will be present or in effect, and both passive and
   * non-passive. This is the primary way to check whether a pokemon has a particular ability.
   * @param {Abilities} ability The ability to check for
   * @param {boolean} canApply If false, it doesn't check whether the ability is currently active
   * @param {boolean} ignoreOverride If true, it ignores ability changing effects
   * @returns {boolean} Whether the ability is present and active
   */
  public hasAbility(ability: Abilities, canApply: boolean = true, ignoreOverride?: boolean): boolean {
    if (this.getAbility(ignoreOverride).id === ability && (!canApply || this.canApplyAbility())) {
      return true;
    }
    if (this.getPassiveAbility().id === ability && this.hasPassive() && (!canApply || this.canApplyAbility(true))) {
      return true;
    }
    return false;
  }

  /**
   * Checks whether a pokemon has an ability with the specified attribute and it's in effect.
   * Accounts for all the various effects which can affect whether an ability will be present or
   * in effect, and both passive and non-passive. This is one of the two primary ways to check
   * whether a pokemon has a particular ability.
   * @param {AbAttr} attrType The ability attribute to check for
   * @param {boolean} canApply If false, it doesn't check whether the ability is currently active
   * @param {boolean} ignoreOverride If true, it ignores ability changing effects
   * @returns {boolean} Whether an ability with that attribute is present and active
   */
  public hasAbilityWithAttr(attrType: Constructor<AbAttr>, canApply: boolean = true, ignoreOverride?: boolean): boolean {
    if ((!canApply || this.canApplyAbility()) && this.getAbility(ignoreOverride).hasAttr(attrType)) {
      return true;
    }
    if (this.hasPassive() && (!canApply || this.canApplyAbility(true)) && this.getPassiveAbility().hasAttr(attrType)) {
      return true;
    }
    return false;
  }

  /**
   * Gets the weight of the Pokemon with subtractive modifiers (Autotomize) happening first
   * and then multiplicative modifiers happening after (Heavy Metal and Light Metal)
   * @returns the kg of the Pokemon (minimum of 0.1)
   */
  public getWeight(): number {
    const autotomizedTag = this.getTag(AutotomizedTag);
    let weightRemoved = 0;
    if (!Utils.isNullOrUndefined(autotomizedTag)) {
      weightRemoved = 100 * autotomizedTag!.autotomizeCount;
    }
    const minWeight = 0.1;
    const weight = new Utils.NumberHolder(this.species.weight - weightRemoved);

    // This will trigger the ability overlay so only call this function when necessary
    applyAbAttrs(WeightMultiplierAbAttr, this, null, false, weight);
    return Math.max(minWeight, weight.value);
  }

  /**
   * @returns the pokemon's current tera {@linkcode Type}
   */
  getTeraType(): Type {
    if (this.hasSpecies(Species.TERAPAGOS)) {
      return Type.STELLAR;
    } else if (this.hasSpecies(Species.OGERPON)) {
      const ogerponForm = this.species.speciesId === Species.OGERPON ? this.formIndex : this.fusionFormIndex;
      switch (ogerponForm) {
        case 0:
        case 4:
          return Type.GRASS;
        case 1:
        case 5:
          return Type.WATER;
        case 2:
        case 6:
          return Type.FIRE;
        case 3:
        case 7:
          return Type.ROCK;
      }
    } else if (this.hasSpecies(Species.SHEDINJA)) {
      return Type.BUG;
    }
    return this.teraType;
  }

  public isGrounded(): boolean {
    return !!this.getTag(GroundedTag) || (!this.isOfType(Type.FLYING, true, true) && !this.hasAbility(Abilities.LEVITATE) && !this.getTag(BattlerTagType.FLOATING) && !this.getTag(SemiInvulnerableTag));
  }

  /**
   * Determines whether this Pokemon is prevented from running or switching due
   * to effects from moves and/or abilities.
   * @param trappedAbMessages - If defined, ability trigger messages
   * (e.g. from Shadow Tag) are forwarded through this array.
   * @param simulated - If `true`, applies abilities via simulated calls.
   * @returns `true` if the pokemon is trapped
   */
  public isTrapped(trappedAbMessages: string[] = [], simulated: boolean = true): boolean {
    const commandedTag = this.getTag(BattlerTagType.COMMANDED);
    if (commandedTag?.getSourcePokemon()?.isActive(true)) {
      return true;
    }

    if (this.isOfType(Type.GHOST)) {
      return false;
    }

    const trappedByAbility = new Utils.BooleanHolder(false);
    /**
     * Contains opposing Pokemon (Enemy/Player Pokemon) depending on perspective
     * Afterwards, it filters out Pokemon that have been switched out of the field so trapped abilities/moves do not trigger
     */
    const opposingFieldUnfiltered = this.isPlayer() ? globalScene.getEnemyField() : globalScene.getPlayerField();
    const opposingField = opposingFieldUnfiltered.filter(enemyPkm => enemyPkm.switchOutStatus === false);

    opposingField.forEach((opponent) =>
      applyCheckTrappedAbAttrs(CheckTrappedAbAttr, opponent, trappedByAbility, this, trappedAbMessages, simulated)
    );

    const side = this.isPlayer() ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY;
    return (trappedByAbility.value || !!this.getTag(TrappedTag) || !!globalScene.arena.getTagOnSide(ArenaTagType.FAIRY_LOCK, side));
  }

  /**
   * Calculates the type of a move when used by this Pokemon after
   * type-changing move and ability attributes have applied.
   * @param move - {@linkcode Move} The move being used.
   * @param simulated - If `true`, prevents showing abilities applied in this calculation.
   * @returns The {@linkcode Type} of the move after attributes are applied
   */
  public getMoveType(move: Move, simulated: boolean = true): Type {
    const moveTypeHolder = new Utils.NumberHolder(move.type);

    applyMoveAttrs(VariableMoveTypeAttr, this, null, move, moveTypeHolder);
    applyPreAttackAbAttrs(MoveTypeChangeAbAttr, this, null, move, simulated, moveTypeHolder);

    globalScene.arena.applyTags(ArenaTagType.ION_DELUGE, simulated, moveTypeHolder);
    if (this.getTag(BattlerTagType.ELECTRIFIED)) {
      moveTypeHolder.value = Type.ELECTRIC;
    }

    return moveTypeHolder.value as Type;
  }


  /**
   * Calculates the effectiveness of a move against the Pokémon.
   * This includes modifiers from move and ability attributes.
   * @param source {@linkcode Pokemon} The attacking Pokémon.
   * @param move {@linkcode Move} The move being used by the attacking Pokémon.
   * @param ignoreAbility Whether to ignore abilities that might affect type effectiveness or immunity (defaults to `false`).
   * @param simulated Whether to apply abilities via simulated calls (defaults to `true`)
   * @param cancelled {@linkcode Utils.BooleanHolder} Stores whether the move was cancelled by a non-type-based immunity.
   * Currently only used by {@linkcode Pokemon.apply} to determine whether a "No effect" message should be shown.
   * @returns The type damage multiplier, indicating the effectiveness of the move
   */
  getMoveEffectiveness(source: Pokemon, move: Move, ignoreAbility: boolean = false, simulated: boolean = true, cancelled?: Utils.BooleanHolder): TypeDamageMultiplier {
    if (!Utils.isNullOrUndefined(this.turnData?.moveEffectiveness)) {
      return this.turnData?.moveEffectiveness;
    }

    if (move.hasAttr(TypelessAttr)) {
      return 1;
    }
    const moveType = source.getMoveType(move);

    const typeMultiplier = new Utils.NumberHolder((move.category !== MoveCategory.STATUS || move.hasAttr(RespectAttackTypeImmunityAttr))
      ? this.getAttackTypeEffectiveness(moveType, source, false, simulated, move)
      : 1);

    applyMoveAttrs(VariableMoveTypeMultiplierAttr, source, this, move, typeMultiplier);
    if (this.getTypes(true, true).find(t => move.isTypeImmune(source, this, t))) {
      typeMultiplier.value = 0;
    }

    if (this.getTag(TarShotTag) && (this.getMoveType(move) === Type.FIRE)) {
      typeMultiplier.value *= 2;
    }

    const cancelledHolder = cancelled ?? new Utils.BooleanHolder(false);
    if (!ignoreAbility) {
      applyPreDefendAbAttrs(TypeImmunityAbAttr, this, source, move, cancelledHolder, simulated, typeMultiplier);

      if (!cancelledHolder.value) {
        applyPreDefendAbAttrs(MoveImmunityAbAttr, this, source, move, cancelledHolder, simulated, typeMultiplier);
      }

      if (!cancelledHolder.value) {
        const defendingSidePlayField = this.isPlayer() ? globalScene.getPlayerField() : globalScene.getEnemyField();
        defendingSidePlayField.forEach((p) => applyPreDefendAbAttrs(FieldPriorityMoveImmunityAbAttr, p, source, move, cancelledHolder));
      }
    }

    const immuneTags = this.findTags(tag => tag instanceof TypeImmuneTag && tag.immuneType === moveType);
    for (const tag of immuneTags) {
      if (move && !move.getAttrs(HitsTagAttr).some(attr => attr.tagType === tag.tagType)) {
        typeMultiplier.value = 0;
        break;
      }
    }

    // Apply Tera Shell's effect to attacks after all immunities are accounted for
    if (!ignoreAbility && move.category !== MoveCategory.STATUS) {
      applyPreDefendAbAttrs(FullHpResistTypeAbAttr, this, source, move, cancelledHolder, simulated, typeMultiplier);
    }

    if (move.category === MoveCategory.STATUS && move.hitsSubstitute(source, this)) {
      typeMultiplier.value = 0;
    }

    return (!cancelledHolder.value ? typeMultiplier.value : 0) as TypeDamageMultiplier;
  }

  /**
   * Calculates the move's type effectiveness multiplier based on the target's type/s.
   * @param moveType {@linkcode Type} the type of the move being used
   * @param source {@linkcode Pokemon} the Pokemon using the move
   * @param ignoreStrongWinds whether or not this ignores strong winds (anticipation, forewarn, stealth rocks)
   * @param simulated tag to only apply the strong winds effect message when the move is used
   * @param move (optional) the move whose type effectiveness is to be checked. Used for applying {@linkcode VariableMoveTypeChartAttr}
   * @returns a multiplier for the type effectiveness
   */
  getAttackTypeEffectiveness(moveType: Type, source?: Pokemon, ignoreStrongWinds: boolean = false, simulated: boolean = true, move?: Move): TypeDamageMultiplier {
    if (moveType === Type.STELLAR) {
      return this.isTerastallized ? 2 : 1;
    }
    const types = this.getTypes(true, true);
    const arena = globalScene.arena;

    // Handle flying v ground type immunity without removing flying type so effective types are still effective
    // Related to https://github.com/pagefaultgames/pokerogue/issues/524
    if (moveType === Type.GROUND && (this.isGrounded() || arena.hasTag(ArenaTagType.GRAVITY))) {
      const flyingIndex = types.indexOf(Type.FLYING);
      if (flyingIndex > -1) {
        types.splice(flyingIndex, 1);
      }
    }

    let multiplier = types.map(defType => {
      const multiplier = new Utils.NumberHolder(getTypeDamageMultiplier(moveType, defType));
      applyChallenges(globalScene.gameMode, ChallengeType.TYPE_EFFECTIVENESS, multiplier);
      if (move) {
        applyMoveAttrs(VariableMoveTypeChartAttr, null, this, move, multiplier, defType);
      }
      if (source) {
        const ignoreImmunity = new Utils.BooleanHolder(false);
        if (source.isActive(true) && source.hasAbilityWithAttr(IgnoreTypeImmunityAbAttr)) {
          applyAbAttrs(IgnoreTypeImmunityAbAttr, source, ignoreImmunity, simulated, moveType, defType);
        }
        if (ignoreImmunity.value) {
          if (multiplier.value === 0) {
            return 1;
          }
        }

        const exposedTags = this.findTags(tag => tag instanceof ExposedTag) as ExposedTag[];
        if (exposedTags.some(t => t.ignoreImmunity(defType, moveType))) {
          if (multiplier.value === 0) {
            return 1;
          }
        }
      }
      return multiplier.value;
    }).reduce((acc, cur) => acc * cur, 1) as TypeDamageMultiplier;

    const typeMultiplierAgainstFlying = new Utils.NumberHolder(getTypeDamageMultiplier(moveType, Type.FLYING));
    applyChallenges(globalScene.gameMode, ChallengeType.TYPE_EFFECTIVENESS, typeMultiplierAgainstFlying);
    // Handle strong winds lowering effectiveness of types super effective against pure flying
    if (!ignoreStrongWinds && arena.weather?.weatherType === WeatherType.STRONG_WINDS && !arena.weather.isEffectSuppressed() && this.isOfType(Type.FLYING) && typeMultiplierAgainstFlying.value === 2) {
      multiplier /= 2;
      if (!simulated) {
        globalScene.queueMessage(i18next.t("weather:strongWindsEffectMessage"));
      }
    }
    return multiplier as TypeDamageMultiplier;
  }

  /**
   * Computes the given Pokemon's matchup score against this Pokemon.
   * In most cases, this score ranges from near-zero to 16, but the maximum possible matchup score is 64.
   * @param opponent {@linkcode Pokemon} The Pokemon to compare this Pokemon against
   * @returns A score value based on how favorable this Pokemon is when fighting the given Pokemon
   */
  getMatchupScore(opponent: Pokemon): number {
    const types = this.getTypes(true);
    const enemyTypes = opponent.getTypes(true, true);
    /** Is this Pokemon faster than the opponent? */
    const outspeed = (this.isActive(true) ? this.getEffectiveStat(Stat.SPD, opponent) : this.getStat(Stat.SPD, false)) >= opponent.getEffectiveStat(Stat.SPD, this);
    /**
     * Based on how effective this Pokemon's types are offensively against the opponent's types.
     * This score is increased by 25 percent if this Pokemon is faster than the opponent.
     */
    let atkScore = opponent.getAttackTypeEffectiveness(types[0], this) * (outspeed ? 1.25 : 1);
    /**
     * Based on how effectively this Pokemon defends against the opponent's types.
     * This score cannot be higher than 4.
     */
    let defScore = 1 / Math.max(this.getAttackTypeEffectiveness(enemyTypes[0], opponent), 0.25);
    if (types.length > 1) {
      atkScore *= opponent.getAttackTypeEffectiveness(types[1], this);
    }
    if (enemyTypes.length > 1) {
      defScore *= (1 / Math.max(this.getAttackTypeEffectiveness(enemyTypes[1], opponent), 0.25));
    }
    /**
     * Based on this Pokemon's HP ratio compared to that of the opponent.
     * This ratio is multiplied by 1.5 if this Pokemon outspeeds the opponent;
     * however, the final ratio cannot be higher than 1.
     */
    let hpDiffRatio = this.getHpRatio() + (1 - opponent.getHpRatio());
    if (outspeed) {
      hpDiffRatio = Math.min(hpDiffRatio * 1.5, 1);
    }
    return (atkScore + defScore) * hpDiffRatio;
  }

  getEvolution(): SpeciesFormEvolution | null {
    if (pokemonEvolutions.hasOwnProperty(this.species.speciesId)) {
      const evolutions = pokemonEvolutions[this.species.speciesId];
      for (const e of evolutions) {
        if (!e.item && this.level >= e.level && (isNullOrUndefined(e.preFormKey) || this.getFormKey() === e.preFormKey)) {
          if (e.condition === null || (e.condition as SpeciesEvolutionCondition).predicate(this)) {
            return e;
          }
        }
      }
    }

    if (this.isFusion() && this.fusionSpecies && pokemonEvolutions.hasOwnProperty(this.fusionSpecies.speciesId)) {
      const fusionEvolutions = pokemonEvolutions[this.fusionSpecies.speciesId].map(e => new FusionSpeciesFormEvolution(this.species.speciesId, e));
      for (const fe of fusionEvolutions) {
        if (!fe.item && this.level >= fe.level && (isNullOrUndefined(fe.preFormKey) || this.getFusionFormKey() === fe.preFormKey)) {
          if (fe.condition === null || (fe.condition as SpeciesEvolutionCondition).predicate(this)) {
            return fe;
          }
        }
      }
    }

    return null;
  }

  /**
   * Gets all level up moves in a given range for a particular pokemon.
   * @param {number} startingLevel Don't include moves below this level
   * @param {boolean} includeEvolutionMoves Whether to include evolution moves
   * @param {boolean} simulateEvolutionChain Whether to include moves from prior evolutions
   * @param {boolean} includeRelearnerMoves Whether to include moves that would require a relearner. Note the move relearner inherently allows evolution moves
   * @returns {LevelMoves} A list of moves and the levels they can be learned at
   */
  getLevelMoves(startingLevel?: number, includeEvolutionMoves: boolean = false, simulateEvolutionChain: boolean = false, includeRelearnerMoves: boolean = false, learnSituation: LearnMoveSituation = LearnMoveSituation.MISC): LevelMoves {
    const ret: LevelMoves = [];
    let levelMoves: LevelMoves = [];
    if (!startingLevel) {
      startingLevel = this.level;
    }
    if (learnSituation === LearnMoveSituation.EVOLUTION_FUSED && this.fusionSpecies) { // For fusion evolutions, get ONLY the moves of the component mon that evolved
      levelMoves = this.getFusionSpeciesForm(true).getLevelMoves().filter(lm => (includeEvolutionMoves && lm[0] === EVOLVE_MOVE) || (includeRelearnerMoves && lm[0] === RELEARN_MOVE) || lm[0] > 0);
    } else {
      if (simulateEvolutionChain) {
        const evolutionChain = this.species.getSimulatedEvolutionChain(this.level, this.hasTrainer(), this.isBoss(), this.isPlayer());
        for (let e = 0; e < evolutionChain.length; e++) {
          // TODO: Might need to pass specific form index in simulated evolution chain
          const speciesLevelMoves = getPokemonSpeciesForm(evolutionChain[e][0], this.formIndex).getLevelMoves();
          if (includeRelearnerMoves) {
            levelMoves.push(...speciesLevelMoves);
          } else {
            levelMoves.push(...speciesLevelMoves.filter(lm => (includeEvolutionMoves && lm[0] === EVOLVE_MOVE) || ((!e || lm[0] > 1) && (e === evolutionChain.length - 1 || lm[0] <= evolutionChain[e + 1][1]))));
          }
        }
      } else {
        levelMoves = this.getSpeciesForm(true).getLevelMoves().filter(lm => (includeEvolutionMoves && lm[0] === EVOLVE_MOVE) || (includeRelearnerMoves && lm[0] === RELEARN_MOVE) || lm[0] > 0);
      }
      if (this.fusionSpecies && learnSituation !== LearnMoveSituation.EVOLUTION_FUSED_BASE) {  // For fusion evolutions, get ONLY the moves of the component mon that evolved
        if (simulateEvolutionChain) {
          const fusionEvolutionChain = this.fusionSpecies.getSimulatedEvolutionChain(this.level, this.hasTrainer(), this.isBoss(), this.isPlayer());
          for (let e = 0; e < fusionEvolutionChain.length; e++) {
            // TODO: Might need to pass specific form index in simulated evolution chain
            const speciesLevelMoves = getPokemonSpeciesForm(fusionEvolutionChain[e][0], this.fusionFormIndex).getLevelMoves();
            if (includeRelearnerMoves) {
              levelMoves.push(...speciesLevelMoves.filter(lm => (includeEvolutionMoves && lm[0] === EVOLVE_MOVE) || lm[0] !== EVOLVE_MOVE));
            } else {
              levelMoves.push(...speciesLevelMoves.filter(lm => (includeEvolutionMoves && lm[0] === EVOLVE_MOVE) || ((!e || lm[0] > 1) && (e === fusionEvolutionChain.length - 1 || lm[0] <= fusionEvolutionChain[e + 1][1]))));
            }
          }
        } else {
          levelMoves.push(...this.getFusionSpeciesForm(true).getLevelMoves().filter(lm => (includeEvolutionMoves && lm[0] === EVOLVE_MOVE) || (includeRelearnerMoves && lm[0] === RELEARN_MOVE) || lm[0] > 0));
        }
      }
    }
    levelMoves.sort((lma: [number, number], lmb: [number, number]) => lma[0] > lmb[0] ? 1 : lma[0] < lmb[0] ? -1 : 0);


    /**
     * Filter out moves not within the correct level range(s)
     * Includes moves below startingLevel, or of specifically level 0 if
     * includeRelearnerMoves or includeEvolutionMoves are true respectively
     */
    levelMoves = levelMoves.filter(lm => {
      const level = lm[0];
      const isRelearner = level < startingLevel;
      const allowedEvolutionMove = (level === 0) && includeEvolutionMoves;

      return !(level > this.level)
          && (includeRelearnerMoves || !isRelearner || allowedEvolutionMove);
    });

    /**
     * This must be done AFTER filtering by level, else if the same move shows up
     * in levelMoves multiple times all but the lowest level one will be skipped.
     * This causes problems when there are intentional duplicates (i.e. Smeargle with Sketch)
     */
    if (levelMoves) {
      this.getUniqueMoves(levelMoves, ret);
    }

    return ret;
  }

  /**
   * Helper function for getLevelMoves.
   * Finds all non-duplicate items from the input, and pushes them into the output.
   * Two items count as duplicate if they have the same Move, regardless of level.
   *
   * @param levelMoves the input array to search for non-duplicates from
   * @param ret the output array to be pushed into.
   */
  private getUniqueMoves(levelMoves: LevelMoves, ret: LevelMoves ): void {
    const uniqueMoves : Moves[] = [];
    for (const lm of levelMoves) {
      if (!uniqueMoves.find(m => m === lm[1])) {
        uniqueMoves.push(lm[1]);
        ret.push(lm);
      }
    }
  }


  /**
   * Get a list of all egg moves
   *
   * @returns list of egg moves
   */
  getEggMoves() : Moves[] | undefined {
    return speciesEggMoves[this.getSpeciesForm().getRootSpeciesId()];
  }

  setMove(moveIndex: number, moveId: Moves): void {
    const move = moveId ? new PokemonMove(moveId) : null;
    this.moveset[moveIndex] = move;
    if (this.summonData?.moveset) {
      this.summonData.moveset[moveIndex] = move;
    }
  }

  /**
   * Function that tries to set a Pokemon shiny based on the trainer's trainer ID and secret ID.
   * Endless Pokemon in the end biome are unable to be set to shiny
   *
   * The exact mechanic is that it calculates E as the XOR of the player's trainer ID and secret ID.
   * F is calculated as the XOR of the first 16 bits of the Pokemon's ID with the last 16 bits.
   * The XOR of E and F are then compared to the {@linkcode shinyThreshold} (or {@linkcode thresholdOverride} if set) to see whether or not to generate a shiny.
   * The base shiny odds are {@linkcode BASE_SHINY_CHANCE} / 65536
   * @param thresholdOverride number that is divided by 2^16 (65536) to get the shiny chance, overrides {@linkcode shinyThreshold} if set (bypassing shiny rate modifiers such as Shiny Charm)
   * @returns true if the Pokemon has been set as a shiny, false otherwise
   */
  trySetShiny(thresholdOverride?: number): boolean {
    // Shiny Pokemon should not spawn in the end biome in endless
    if (globalScene.gameMode.isEndless && globalScene.arena.biomeType === Biome.END) {
      return false;
    }

    const rand1 = (this.id & 0xFFFF0000) >>> 16;
    const rand2 = (this.id & 0x0000FFFF);

    const E = globalScene.gameData.trainerId ^ globalScene.gameData.secretId;
    const F = rand1 ^ rand2;

    const shinyThreshold = new Utils.NumberHolder(BASE_SHINY_CHANCE);
    if (thresholdOverride === undefined) {
      if (globalScene.eventManager.isEventActive()) {
        shinyThreshold.value *= globalScene.eventManager.getShinyMultiplier();
      }
      if (!this.hasTrainer()) {
        globalScene.applyModifiers(ShinyRateBoosterModifier, true, shinyThreshold);
      }
    } else {
      shinyThreshold.value = thresholdOverride;
    }

    this.shiny = (E ^ F) < shinyThreshold.value;

    if (this.shiny) {
      this.initShinySparkle();
    }

    return this.shiny;
  }

  /**
   * Function that tries to set a Pokemon shiny based on seed.
   * For manual use only, usually to roll a Pokemon's shiny chance a second time.
   * If it rolls shiny, also sets a random variant and give the Pokemon the associated luck.
   *
   * The base shiny odds are {@linkcode BASE_SHINY_CHANCE} / `65536`
   * @param thresholdOverride number that is divided by `2^16` (`65536`) to get the shiny chance, overrides {@linkcode shinyThreshold} if set (bypassing shiny rate modifiers such as Shiny Charm)
   * @param applyModifiersToOverride If {@linkcode thresholdOverride} is set and this is true, will apply Shiny Charm and event modifiers to {@linkcode thresholdOverride}
   * @returns `true` if the Pokemon has been set as a shiny, `false` otherwise
   */
  public trySetShinySeed(thresholdOverride?: number, applyModifiersToOverride?: boolean): boolean {
    const shinyThreshold = new Utils.NumberHolder(BASE_SHINY_CHANCE);
    if (thresholdOverride === undefined || applyModifiersToOverride) {
      if (thresholdOverride !== undefined && applyModifiersToOverride) {
        shinyThreshold.value = thresholdOverride;
      }
      if (globalScene.eventManager.isEventActive()) {
        shinyThreshold.value *= globalScene.eventManager.getShinyMultiplier();
      }
      if (!this.hasTrainer()) {
        globalScene.applyModifiers(ShinyRateBoosterModifier, true, shinyThreshold);
      }
    } else {
      shinyThreshold.value = thresholdOverride;
    }

    this.shiny = randSeedInt(65536) < shinyThreshold.value;

    if (this.shiny) {
      this.variant = this.generateShinyVariant();
      this.luck = this.variant + 1 + (this.fusionShiny ? this.fusionVariant + 1 : 0);
      this.initShinySparkle();
    }

    return this.shiny;
  }

  /**
   * Generates a shiny variant
   * @returns `0-2`, with the following probabilities:
   * - Has a 10% chance of returning `2` (epic variant)
   * - Has a 30% chance of returning `1` (rare variant)
   * - Has a 60% chance of returning `0` (basic shiny)
   */
  protected generateShinyVariant(): Variant {
    const formIndex: number = this.formIndex;
    let variantDataIndex: string | number = this.species.speciesId;
    if (this.species.forms.length > 0) {
      const formKey = this.species.forms[formIndex]?.formKey;
      if (formKey) {
        variantDataIndex = `${variantDataIndex}-${formKey}`;
      }
    }
    // Checks if there is no variant data for both the index or index with form
    if (!this.shiny || (!variantData.hasOwnProperty(variantDataIndex) && !variantData.hasOwnProperty(this.species.speciesId))) {
      return 0;
    }
    const rand = new Utils.NumberHolder(0);
    globalScene.executeWithSeedOffset(() => {
      rand.value = Utils.randSeedInt(10);
    }, this.id, globalScene.waveSeed);
    if (rand.value >= SHINY_VARIANT_CHANCE) {
      return 0;             // 6/10
    } else if (rand.value >= SHINY_EPIC_CHANCE) {
      return 1;             // 3/10
    } else {
      return 2;             // 1/10
    }
  }

  /**
   * Function that tries to set a Pokemon to have its hidden ability based on seed, if it exists.
   * For manual use only, usually to roll a Pokemon's hidden ability chance a second time.
   *
   * The base hidden ability odds are {@linkcode BASE_HIDDEN_ABILITY_CHANCE} / `65536`
   * @param thresholdOverride number that is divided by `2^16` (`65536`) to get the HA chance, overrides {@linkcode haThreshold} if set (bypassing HA rate modifiers such as Ability Charm)
   * @param applyModifiersToOverride If {@linkcode thresholdOverride} is set and this is true, will apply Ability Charm to {@linkcode thresholdOverride}
   * @returns `true` if the Pokemon has been set to have its hidden ability, `false` otherwise
   */
  public tryRerollHiddenAbilitySeed(thresholdOverride?: number, applyModifiersToOverride?: boolean): boolean {
    if (!this.species.abilityHidden) {
      return false;
    }
    const haThreshold = new Utils.NumberHolder(BASE_HIDDEN_ABILITY_CHANCE);
    if (thresholdOverride === undefined || applyModifiersToOverride) {
      if (thresholdOverride !== undefined && applyModifiersToOverride) {
        haThreshold.value = thresholdOverride;
      }
      if (!this.hasTrainer()) {
        globalScene.applyModifiers(HiddenAbilityRateBoosterModifier, true, haThreshold);
      }
    } else {
      haThreshold.value = thresholdOverride;
    }

    if (randSeedInt(65536) < haThreshold.value) {
      this.abilityIndex = 2;
    }

    return this.abilityIndex === 2;
  }

  public generateFusionSpecies(forStarter?: boolean): void {
    const hiddenAbilityChance = new Utils.NumberHolder(BASE_HIDDEN_ABILITY_CHANCE);
    if (!this.hasTrainer()) {
      globalScene.applyModifiers(HiddenAbilityRateBoosterModifier, true, hiddenAbilityChance);
    }

    const hasHiddenAbility = !Utils.randSeedInt(hiddenAbilityChance.value);
    const randAbilityIndex = Utils.randSeedInt(2);

    const filter = !forStarter ?
      this.species.getCompatibleFusionSpeciesFilter()
      : (species: PokemonSpecies) => {
        return pokemonEvolutions.hasOwnProperty(species.speciesId)
          && !pokemonPrevolutions.hasOwnProperty(species.speciesId)
          && !species.subLegendary
          && !species.legendary
          && !species.mythical
          && !species.isTrainerForbidden()
          && species.speciesId !== this.species.speciesId
          && species.speciesId !== Species.DITTO;
      };

    let fusionOverride: PokemonSpecies | undefined = undefined;

    if (forStarter && this instanceof PlayerPokemon && Overrides.STARTER_FUSION_SPECIES_OVERRIDE) {
      fusionOverride = getPokemonSpecies(Overrides.STARTER_FUSION_SPECIES_OVERRIDE);
    } else if (this instanceof EnemyPokemon && Overrides.OPP_FUSION_SPECIES_OVERRIDE) {
      fusionOverride = getPokemonSpecies(Overrides.OPP_FUSION_SPECIES_OVERRIDE);
    }

    this.fusionSpecies = fusionOverride ?? globalScene.randomSpecies(globalScene.currentBattle?.waveIndex || 0, this.level, false, filter, true);
    this.fusionAbilityIndex = (this.fusionSpecies.abilityHidden && hasHiddenAbility ? 2 : this.fusionSpecies.ability2 !== this.fusionSpecies.ability1 ? randAbilityIndex : 0);
    this.fusionShiny = this.shiny;
    this.fusionVariant = this.variant;

    if (this.fusionSpecies.malePercent === null) {
      this.fusionGender = Gender.GENDERLESS;
    } else {
      const genderChance = (this.id % 256) * 0.390625;
      if (genderChance < this.fusionSpecies.malePercent) {
        this.fusionGender = Gender.MALE;
      } else {
        this.fusionGender = Gender.FEMALE;
      }
    }

    this.fusionFormIndex = globalScene.getSpeciesFormIndex(this.fusionSpecies, this.fusionGender, this.getNature(), true);
    this.fusionLuck = this.luck;

    this.generateName();
  }

  public clearFusionSpecies(): void {
    this.fusionSpecies = null;
    this.fusionFormIndex = 0;
    this.fusionAbilityIndex = 0;
    this.fusionShiny = false;
    this.fusionVariant = 0;
    this.fusionGender = 0;
    this.fusionLuck = 0;
    this.fusionCustomPokemonData = null;

    this.generateName();
    this.calculateStats();
  }

  /** Generates a semi-random moveset for a Pokemon */
  public generateAndPopulateMoveset(): void {
    this.moveset = [];
    let movePool: [Moves, number][] = [];
    const allLevelMoves = this.getLevelMoves(1, true, true);
    if (!allLevelMoves) {
      console.warn("Error encountered trying to generate moveset for:", this.species.name);
      return;
    }

    for (let m = 0; m < allLevelMoves.length; m++) {
      const levelMove = allLevelMoves[m];
      if (this.level < levelMove[0]) {
        break;
      }
      let weight = levelMove[0];
      // Evolution Moves
      if (weight === 0) {
        weight = 50;
      }
      // Assume level 1 moves with 80+ BP are "move reminder" moves and bump their weight
      if (weight === 1 && allMoves[levelMove[1]].power >= 80) {
        weight = 40;
      }
      if (!movePool.some(m => m[0] === levelMove[1]) && !allMoves[levelMove[1]].name.endsWith(" (N)")) {
        movePool.push([ levelMove[1], weight ]);
      }
    }

    if (this.hasTrainer()) {
      const tms = Object.keys(tmSpecies);
      for (const tm of tms) {
        const moveId = parseInt(tm) as Moves;
        let compatible = false;
        for (const p of tmSpecies[tm]) {
          if (Array.isArray(p)) {
            if (p[0] === this.species.speciesId || (this.fusionSpecies && p[0] === this.fusionSpecies.speciesId) && p.slice(1).indexOf(this.species.forms[this.formIndex]) > -1) {
              compatible = true;
              break;
            }
          } else if (p === this.species.speciesId || (this.fusionSpecies && p === this.fusionSpecies.speciesId)) {
            compatible = true;
            break;
          }
        }
        if (compatible && !movePool.some(m => m[0] === moveId) && !allMoves[moveId].name.endsWith(" (N)")) {
          if (tmPoolTiers[moveId] === ModifierTier.COMMON && this.level >= 15) {
            movePool.push([ moveId, 4 ]);
          } else if (tmPoolTiers[moveId] === ModifierTier.GREAT && this.level >= 30) {
            movePool.push([ moveId, 8 ]);
          } else if (tmPoolTiers[moveId] === ModifierTier.ULTRA && this.level >= 50) {
            movePool.push([ moveId, 14 ]);
          }
        }
      }

      // No egg moves below level 60
      if (this.level >= 60) {
        for (let i = 0; i < 3; i++) {
          const moveId = speciesEggMoves[this.species.getRootSpeciesId()][i];
          if (!movePool.some(m => m[0] === moveId) && !allMoves[moveId].name.endsWith(" (N)")) {
            movePool.push([ moveId, 40 ]);
          }
        }
        const moveId = speciesEggMoves[this.species.getRootSpeciesId()][3];
        // No rare egg moves before e4
        if (this.level >= 170 && !movePool.some(m => m[0] === moveId) && !allMoves[moveId].name.endsWith(" (N)") && !this.isBoss()) {
          movePool.push([ moveId, 30 ]);
        }
        if (this.fusionSpecies) {
          for (let i = 0; i < 3; i++) {
            const moveId = speciesEggMoves[this.fusionSpecies.getRootSpeciesId()][i];
            if (!movePool.some(m => m[0] === moveId) && !allMoves[moveId].name.endsWith(" (N)")) {
              movePool.push([ moveId, 40 ]);
            }
          }
          const moveId = speciesEggMoves[this.fusionSpecies.getRootSpeciesId()][3];
          // No rare egg moves before e4
          if (this.level >= 170 && !movePool.some(m => m[0] === moveId) && !allMoves[moveId].name.endsWith(" (N)") && !this.isBoss()) {
            movePool.push([ moveId, 30 ]);
          }
        }
      }
    }

    // Bosses never get self ko moves or Pain Split
    if (this.isBoss()) {
      movePool = movePool.filter(m => !allMoves[m[0]].hasAttr(SacrificialAttr));
      movePool = movePool.filter(m => !allMoves[m[0]].hasAttr(HpSplitAttr));
    }
    movePool = movePool.filter(m => !allMoves[m[0]].hasAttr(SacrificialAttrOnHit));
    if (this.hasTrainer()) {
      // Trainers never get OHKO moves
      movePool = movePool.filter(m => !allMoves[m[0]].hasAttr(OneHitKOAttr));
      // Half the weight of self KO moves
      movePool = movePool.map(m => [ m[0], m[1] * (!!allMoves[m[0]].hasAttr(SacrificialAttr) ? 0.5 : 1) ]);
      movePool = movePool.map(m => [ m[0], m[1] * (!!allMoves[m[0]].hasAttr(SacrificialAttrOnHit) ? 0.5 : 1) ]);
      // Trainers get a weight bump to stat buffing moves
      movePool = movePool.map(m => [ m[0], m[1] * (allMoves[m[0]].getAttrs(StatStageChangeAttr).some(a => a.stages > 1 && a.selfTarget) ? 1.25 : 1) ]);
      // Trainers get a weight decrease to multiturn moves
      movePool = movePool.map(m => [ m[0], m[1] * (!!allMoves[m[0]].isChargingMove() || !!allMoves[m[0]].hasAttr(RechargeAttr) ? 0.7 : 1) ]);
    }

    // Weight towards higher power moves, by reducing the power of moves below the highest power.
    // Caps max power at 90 to avoid something like hyper beam ruining the stats.
    // This is a pretty soft weighting factor, although it is scaled with the weight multiplier.
    const maxPower = Math.min(movePool.reduce((v, m) => Math.max(allMoves[m[0]].calculateEffectivePower(), v), 40), 90);
    movePool = movePool.map(m => [ m[0], m[1] * (allMoves[m[0]].category === MoveCategory.STATUS ? 1 : Math.max(Math.min(allMoves[m[0]].calculateEffectivePower() / maxPower, 1), 0.5)) ]);

    // Weight damaging moves against the lower stat. This uses a non-linear relationship.
    // If the higher stat is 1 - 1.09x higher, no change. At higher stat ~1.38x lower stat, off-stat moves have half weight.
    // One third weight at ~1.58x higher, one quarter weight at ~1.73x higher, one fifth at ~1.87x, and one tenth at ~2.35x higher.
    const atk = this.getStat(Stat.ATK);
    const spAtk = this.getStat(Stat.SPATK);
    const worseCategory: MoveCategory = atk > spAtk ? MoveCategory.SPECIAL : MoveCategory.PHYSICAL;
    const statRatio = worseCategory === MoveCategory.PHYSICAL ? atk / spAtk : spAtk / atk;
    movePool = movePool.map(m => [ m[0], m[1] * (allMoves[m[0]].category === worseCategory ? Math.min(Math.pow(statRatio, 3) * 1.3, 1) : 1) ]);

    /** The higher this is the more the game weights towards higher level moves. At `0` all moves are equal weight. */
    let weightMultiplier = 0.9;
    if (this.hasTrainer()) {
      weightMultiplier += 0.7;
    }
    if (this.isBoss()) {
      weightMultiplier += 0.4;
    }
    const baseWeights: [Moves, number][] = movePool.map(m => [ m[0], Math.ceil(Math.pow(m[1], weightMultiplier) * 100) ]);

    // Trainers and bosses always force a stab move
    if (this.hasTrainer() || this.isBoss()) {
      const stabMovePool = baseWeights.filter(m => allMoves[m[0]].category !== MoveCategory.STATUS && this.isOfType(allMoves[m[0]].type));

      if (stabMovePool.length) {
        const totalWeight = stabMovePool.reduce((v, m) => v + m[1], 0);
        let rand = Utils.randSeedInt(totalWeight);
        let index = 0;
        while (rand > stabMovePool[index][1]) {
          rand -= stabMovePool[index++][1];
        }
        this.moveset.push(new PokemonMove(stabMovePool[index][0], 0, 0));
      }
    } else { // Normal wild pokemon just force a random damaging move
      const attackMovePool = baseWeights.filter(m => allMoves[m[0]].category !== MoveCategory.STATUS);
      if (attackMovePool.length) {
        const totalWeight = attackMovePool.reduce((v, m) => v + m[1], 0);
        let rand = Utils.randSeedInt(totalWeight);
        let index = 0;
        while (rand > attackMovePool[index][1]) {
          rand -= attackMovePool[index++][1];
        }
        this.moveset.push(new PokemonMove(attackMovePool[index][0], 0, 0));
      }
    }

    while (baseWeights.length > this.moveset.length && this.moveset.length < 4) {
      if (this.hasTrainer()) {
        // Sqrt the weight of any damaging moves with overlapping types. This is about a 0.05 - 0.1 multiplier.
        // Other damaging moves 2x weight if 0-1 damaging moves, 0.5x if 2, 0.125x if 3. These weights get 20x if STAB.
        // Status moves remain unchanged on weight, this encourages 1-2
        movePool = baseWeights.filter(m => !this.moveset.some(mo => m[0] === mo?.moveId)).map((m) => {
          let ret: number;
          if (this.moveset.some(mo => mo?.getMove().category !== MoveCategory.STATUS && mo?.getMove().type === allMoves[m[0]].type)) {
            ret = Math.ceil(Math.sqrt(m[1]));
          } else if (allMoves[m[0]].category !== MoveCategory.STATUS) {
            ret = Math.ceil(m[1] / Math.max(Math.pow(4, this.moveset.filter(mo => (mo?.getMove().power ?? 0) > 1).length) / 8, 0.5) * (this.isOfType(allMoves[m[0]].type) ? 20 : 1));
          } else {
            ret = m[1];
          }
          return [ m[0], ret ];
        });
      } else {
        // Non-trainer pokemon just use normal weights
        movePool = baseWeights.filter(m => !this.moveset.some(mo => m[0] === mo?.moveId));
      }
      const totalWeight = movePool.reduce((v, m) => v + m[1], 0);
      let rand = Utils.randSeedInt(totalWeight);
      let index = 0;
      while (rand > movePool[index][1]) {
        rand -= movePool[index++][1];
      }
      this.moveset.push(new PokemonMove(movePool[index][0], 0, 0));
    }

    // Trigger FormChange, except for enemy Pokemon during Mystery Encounters, to avoid crashes
    if (this.isPlayer() || !globalScene.currentBattle?.isBattleMysteryEncounter() || !globalScene.currentBattle?.mysteryEncounter) {
      globalScene.triggerPokemonFormChange(this, SpeciesFormChangeMoveLearnedTrigger);
    }
  }

  public trySelectMove(moveIndex: number, ignorePp?: boolean): boolean {
    const move = this.getMoveset().length > moveIndex
      ? this.getMoveset()[moveIndex]
      : null;
    return move?.isUsable(this, ignorePp) ?? false;
  }

  showInfo(): void {
    if (!this.battleInfo.visible) {
      const otherBattleInfo = globalScene.fieldUI.getAll().slice(0, 4).filter(ui => ui instanceof BattleInfo && ((ui as BattleInfo) instanceof PlayerBattleInfo) === this.isPlayer()).find(() => true);
      if (!otherBattleInfo || !this.getFieldIndex()) {
        globalScene.fieldUI.sendToBack(this.battleInfo);
        globalScene.sendTextToBack(); // Push the top right text objects behind everything else
      } else {
        globalScene.fieldUI.moveAbove(this.battleInfo, otherBattleInfo);
      }
      this.battleInfo.setX(this.battleInfo.x + (this.isPlayer() ? 150 : !this.isBoss() ? -150 : -198));
      this.battleInfo.setVisible(true);
      if (this.isPlayer()) {
        this.battleInfo.expMaskRect.x += 150;
      }
      globalScene.tweens.add({
        targets: [ this.battleInfo, this.battleInfo.expMaskRect ],
        x: this.isPlayer() ? "-=150" : `+=${!this.isBoss() ? 150 : 246}`,
        duration: 1000,
        ease: "Cubic.easeOut"
      });
    }
  }

  hideInfo(): Promise<void> {
    return new Promise(resolve => {
      if (this.battleInfo && this.battleInfo.visible) {
        globalScene.tweens.add({
          targets: [ this.battleInfo, this.battleInfo.expMaskRect ],
          x: this.isPlayer() ? "+=150" : `-=${!this.isBoss() ? 150 : 246}`,
          duration: 500,
          ease: "Cubic.easeIn",
          onComplete: () => {
            if (this.isPlayer()) {
              this.battleInfo.expMaskRect.x -= 150;
            }
            this.battleInfo.setVisible(false);
            this.battleInfo.setX(this.battleInfo.x - (this.isPlayer() ? 150 : !this.isBoss() ? -150 : -198));
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * sets if the pokemon is switching out (if it's a enemy wild implies it's going to flee)
   * @param status - boolean
   */
  setSwitchOutStatus(status: boolean): void {
    this.switchOutStatus = status;
  }

  updateInfo(instant?: boolean): Promise<void> {
    return this.battleInfo.updateInfo(this, instant);
  }

  /**
   * Show or hide the type effectiveness multiplier window
   * Passing undefined will hide the window
   */
  updateEffectiveness(effectiveness?: string) {
    this.battleInfo.updateEffectiveness(effectiveness);
  }

  toggleStats(visible: boolean): void {
    this.battleInfo.toggleStats(visible);
  }

  toggleFlyout(visible: boolean): void {
    this.battleInfo.toggleFlyout(visible);
  }

  /**
   * Adds experience to this PlayerPokemon, subject to wave based level caps.
   * @param exp The amount of experience to add
   * @param ignoreLevelCap Whether to ignore level caps when adding experience (defaults to false)
   */
  addExp(exp: number, ignoreLevelCap: boolean = false) {
    const maxExpLevel = globalScene.getMaxExpLevel(ignoreLevelCap);
    const initialExp = this.exp;
    this.exp += exp;
    while (this.level < maxExpLevel && this.exp >= getLevelTotalExp(this.level + 1, this.species.growthRate)) {
      this.level++;
    }
    if (this.level >= maxExpLevel) {
      console.log(initialExp, this.exp, getLevelTotalExp(this.level, this.species.growthRate));
      this.exp = Math.max(getLevelTotalExp(this.level, this.species.growthRate), initialExp);
    }
    this.levelExp = this.exp - getLevelTotalExp(this.level, this.species.growthRate);
  }

  /**
   * Compares if `this` and {@linkcode target} are on the same team.
   * @param target the {@linkcode Pokemon} to compare against.
   * @returns `true` if the two pokemon are allies, `false` otherwise
   */
  public isOpponent(target: Pokemon): boolean {
    return this.isPlayer() !== target.isPlayer();
  }

  getOpponent(targetIndex: number): Pokemon | null {
    const ret = this.getOpponents()[targetIndex];
    if (ret.summonData) {
      return ret;
    }
    return null;
  }

  getOpponents(): Pokemon[] {
    return ((this.isPlayer() ? globalScene.getEnemyField() : globalScene.getPlayerField()) as Pokemon[]).filter(p => p.isActive());
  }

  getOpponentDescriptor(): string {
    const opponents = this.getOpponents();
    if (opponents.length === 1) {
      return opponents[0].name;
    }
    return this.isPlayer() ? i18next.t("arenaTag:opposingTeam") : i18next.t("arenaTag:yourTeam");
  }

  getAlly(): Pokemon {
    return (this.isPlayer() ? globalScene.getPlayerField() : globalScene.getEnemyField())[this.getFieldIndex() ? 0 : 1];
  }

  /**
   * Gets the Pokémon on the allied field.
   *
   * @returns An array of Pokémon on the allied field.
   */
  getAlliedField(): Pokemon[] {
    return this instanceof PlayerPokemon ? globalScene.getPlayerField() : globalScene.getEnemyField();
  }

  /**
   * Calculates the stat stage multiplier of the user against an opponent.
   *
   * Note that this does not apply to evasion or accuracy
   * @see {@linkcode getAccuracyMultiplier}
   * @param stat the desired {@linkcode EffectiveStat}
   * @param opponent the target {@linkcode Pokemon}
   * @param move the {@linkcode Move} being used
   * @param ignoreOppAbility determines whether the effects of the opponent's abilities (i.e. Unaware) should be ignored (`false` by default)
   * @param isCritical determines whether a critical hit has occurred or not (`false` by default)
   * @param simulated determines whether effects are applied without altering game state (`true` by default)
   * @param ignoreHeldItems determines whether this Pokemon's held items should be ignored during the stat calculation, default `false`
   * @return the stat stage multiplier to be used for effective stat calculation
   */
  getStatStageMultiplier(stat: EffectiveStat, opponent?: Pokemon, move?: Move, ignoreOppAbility: boolean = false, isCritical: boolean = false, simulated: boolean = true, ignoreHeldItems: boolean = false): number {
    const statStage = new Utils.NumberHolder(this.getStatStage(stat));
    const ignoreStatStage = new Utils.BooleanHolder(false);

    if (opponent) {
      if (isCritical) {
        switch (stat) {
          case Stat.ATK:
          case Stat.SPATK:
            statStage.value = Math.max(statStage.value, 0);
            break;
          case Stat.DEF:
          case Stat.SPDEF:
            statStage.value = Math.min(statStage.value, 0);
            break;
        }
      }
      if (!ignoreOppAbility) {
        applyAbAttrs(IgnoreOpponentStatStagesAbAttr, opponent, null, simulated, stat, ignoreStatStage);
      }
      if (move) {
        applyMoveAttrs(IgnoreOpponentStatStagesAttr, this, opponent, move, ignoreStatStage);
      }
    }

    if (!ignoreStatStage.value) {
      const statStageMultiplier = new Utils.NumberHolder(Math.max(2, 2 + statStage.value) / Math.max(2, 2 - statStage.value));
      if (!ignoreHeldItems) {
        globalScene.applyModifiers(TempStatStageBoosterModifier, this.isPlayer(), stat, statStageMultiplier);
      }
      return Math.min(statStageMultiplier.value, 4);
    }
    return 1;
  }

  /**
   * Calculates the accuracy multiplier of the user against a target.
   *
   * This method considers various factors such as the user's accuracy level, the target's evasion level,
   * abilities, and modifiers to compute the final accuracy multiplier.
   *
   * @param target {@linkcode Pokemon} - The target Pokémon against which the move is used.
   * @param sourceMove {@linkcode Move}  - The move being used by the user.
   * @returns The calculated accuracy multiplier.
   */
  getAccuracyMultiplier(target: Pokemon, sourceMove: Move): number {
    const isOhko = sourceMove.hasAttr(OneHitKOAccuracyAttr);
    if (isOhko) {
      return 1;
    }

    const userAccStage = new Utils.NumberHolder(this.getStatStage(Stat.ACC));
    const targetEvaStage = new Utils.NumberHolder(target.getStatStage(Stat.EVA));

    const ignoreAccStatStage = new Utils.BooleanHolder(false);
    const ignoreEvaStatStage = new Utils.BooleanHolder(false);

    applyAbAttrs(IgnoreOpponentStatStagesAbAttr, target, null, false, Stat.ACC, ignoreAccStatStage);
    applyAbAttrs(IgnoreOpponentStatStagesAbAttr, this, null, false, Stat.EVA, ignoreEvaStatStage);
    applyMoveAttrs(IgnoreOpponentStatStagesAttr, this, target, sourceMove, ignoreEvaStatStage);

    globalScene.applyModifiers(TempStatStageBoosterModifier, this.isPlayer(), Stat.ACC, userAccStage);

    userAccStage.value = ignoreAccStatStage.value ? 0 : Math.min(userAccStage.value, 6);
    targetEvaStage.value = ignoreEvaStatStage.value ? 0 : targetEvaStage.value;

    if (target.findTag(t => t instanceof ExposedTag)) {
      targetEvaStage.value = Math.min(0, targetEvaStage.value);
    }

    const accuracyMultiplier = new Utils.NumberHolder(1);
    if (userAccStage.value !== targetEvaStage.value) {
      accuracyMultiplier.value = userAccStage.value > targetEvaStage.value
        ? (3 + Math.min(userAccStage.value - targetEvaStage.value, 6)) / 3
        : 3 / (3 + Math.min(targetEvaStage.value - userAccStage.value, 6));
    }

    applyStatMultiplierAbAttrs(StatMultiplierAbAttr, this, Stat.ACC, accuracyMultiplier, false, sourceMove);

    const evasionMultiplier = new Utils.NumberHolder(1);
    applyStatMultiplierAbAttrs(StatMultiplierAbAttr, target, Stat.EVA, evasionMultiplier);

    return accuracyMultiplier.value / evasionMultiplier.value;
  }

  /**
   * Calculates the base damage of the given move against this Pokemon when attacked by the given source.
   * Used during damage calculation and for Shell Side Arm's forecasting effect.
   * @param source the attacking {@linkcode Pokemon}.
   * @param move the {@linkcode Move} used in the attack.
   * @param moveCategory the move's {@linkcode MoveCategory} after variable-category effects are applied.
   * @param ignoreAbility if `true`, ignores this Pokemon's defensive ability effects (defaults to `false`).
   * @param ignoreSourceAbility if `true`, ignore's the attacking Pokemon's ability effects (defaults to `false`).
   * @param isCritical if `true`, calculates effective stats as if the hit were critical (defaults to `false`).
   * @param simulated if `true`, suppresses changes to game state during calculation (defaults to `true`).
   * @returns The move's base damage against this Pokemon when used by the source Pokemon.
   */
  getBaseDamage(source: Pokemon, move: Move, moveCategory: MoveCategory, ignoreAbility: boolean = false, ignoreSourceAbility: boolean = false, isCritical: boolean = false, simulated: boolean = true): number {
    const isPhysical = moveCategory === MoveCategory.PHYSICAL;

    /** A base damage multiplier based on the source's level */
    const levelMultiplier = (2 * source.level / 5 + 2);

    /** The power of the move after power boosts from abilities, etc. have applied */
    const power = move.calculateBattlePower(source, this, simulated);

    /**
     * The attacker's offensive stat for the given move's category.
     * Critical hits cause negative stat stages to be ignored.
     */
    const sourceAtk = new Utils.NumberHolder(source.getEffectiveStat(isPhysical ? Stat.ATK : Stat.SPATK, this, undefined, ignoreSourceAbility, ignoreAbility, isCritical, simulated));
    applyMoveAttrs(VariableAtkAttr, source, this, move, sourceAtk);

    /**
     * This Pokemon's defensive stat for the given move's category.
     * Critical hits cause positive stat stages to be ignored.
     */
    const targetDef = new Utils.NumberHolder(this.getEffectiveStat(isPhysical ? Stat.DEF : Stat.SPDEF, source, move, ignoreAbility, ignoreSourceAbility, isCritical, simulated));
    applyMoveAttrs(VariableDefAttr, source, this, move, targetDef);

    /**
     * The attack's base damage, as determined by the source's level, move power
     * and Attack stat as well as this Pokemon's Defense stat
     */
    const baseDamage = ((levelMultiplier * power * sourceAtk.value / targetDef.value) / 50) + 2;

    /** Debug message for non-simulated calls (i.e. when damage is actually dealt) */
    if (!simulated) {
      console.log("base damage", baseDamage, move.name, power, sourceAtk.value, targetDef.value);
    }

    return baseDamage;
  }

  /**
   * Calculates the damage of an attack made by another Pokemon against this Pokemon
   * @param source {@linkcode Pokemon} the attacking Pokemon
   * @param move {@linkcode Pokemon} the move used in the attack
   * @param ignoreAbility If `true`, ignores this Pokemon's defensive ability effects
   * @param ignoreSourceAbility If `true`, ignores the attacking Pokemon's ability effects
   * @param isCritical If `true`, calculates damage for a critical hit.
   * @param simulated If `true`, suppresses changes to game state during the calculation.
   * @returns a {@linkcode DamageCalculationResult} object with three fields:
   * - `cancelled`: `true` if the move was cancelled by another effect.
   * - `result`: {@linkcode HitResult} indicates the attack's type effectiveness.
   * - `damage`: `number` the attack's final damage output.
   */
  getAttackDamage(source: Pokemon, move: Move, ignoreAbility: boolean = false, ignoreSourceAbility: boolean = false, isCritical: boolean = false, simulated: boolean = true): DamageCalculationResult {
    const damage = new Utils.NumberHolder(0);
    const defendingSide = this.isPlayer() ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY;

    const variableCategory = new Utils.NumberHolder(move.category);
    applyMoveAttrs(VariableMoveCategoryAttr, source, this, move, variableCategory);
    const moveCategory = variableCategory.value as MoveCategory;

    /** The move's type after type-changing effects are applied */
    const moveType = source.getMoveType(move);

    /** If `value` is `true`, cancels the move and suppresses "No Effect" messages */
    const cancelled = new Utils.BooleanHolder(false);

    /**
     * The effectiveness of the move being used. Along with type matchups, this
     * accounts for changes in effectiveness from the move's attributes and the
     * abilities of both the source and this Pokemon.
     *
     * Note that the source's abilities are not ignored here
     */
    const typeMultiplier = this.getMoveEffectiveness(source, move, ignoreAbility, simulated, cancelled);

    const isPhysical = moveCategory === MoveCategory.PHYSICAL;

    /** Combined damage multiplier from field effects such as weather, terrain, etc. */
    const arenaAttackTypeMultiplier = new Utils.NumberHolder(globalScene.arena.getAttackTypeMultiplier(moveType, source.isGrounded()));
    applyMoveAttrs(IgnoreWeatherTypeDebuffAttr, source, this, move, arenaAttackTypeMultiplier);

    const isTypeImmune = (typeMultiplier * arenaAttackTypeMultiplier.value) === 0;

    if (cancelled.value || isTypeImmune) {
      return {
        cancelled: cancelled.value,
        result: move.id === Moves.SHEER_COLD ? HitResult.IMMUNE : HitResult.NO_EFFECT,
        damage: 0
      };
    }

    // If the attack deals fixed damage, return a result with that much damage
    const fixedDamage = new Utils.NumberHolder(0);
    applyMoveAttrs(FixedDamageAttr, source, this, move, fixedDamage);
    if (fixedDamage.value) {
      const multiLensMultiplier = new Utils.NumberHolder(1);
      globalScene.applyModifiers(PokemonMultiHitModifier, source.isPlayer(), source, move.id, null, multiLensMultiplier);
      fixedDamage.value = Utils.toDmgValue(fixedDamage.value * multiLensMultiplier.value);

      return {
        cancelled: false,
        result: HitResult.EFFECTIVE,
        damage: fixedDamage.value
      };
    }

    // If the attack is a one-hit KO move, return a result with damage equal to this Pokemon's HP
    const isOneHitKo = new Utils.BooleanHolder(false);
    applyMoveAttrs(OneHitKOAttr, source, this, move, isOneHitKo);
    if (isOneHitKo.value) {
      return {
        cancelled: false,
        result: HitResult.ONE_HIT_KO,
        damage: this.hp
      };
    }

    /**
     * The attack's base damage, as determined by the source's level, move power
     * and Attack stat as well as this Pokemon's Defense stat
     */
    const baseDamage = this.getBaseDamage(source, move, moveCategory, ignoreAbility, ignoreSourceAbility, isCritical, simulated);

    /** 25% damage debuff on moves hitting more than one non-fainted target (regardless of immunities) */
    const { targets, multiple } = getMoveTargets(source, move.id);
    const numTargets = multiple ? targets.length : 1;
    const targetMultiplier = (numTargets > 1) ? 0.75 : 1;

    /** Multiplier for moves enhanced by Multi-Lens and/or Parental Bond */
    const multiStrikeEnhancementMultiplier = new Utils.NumberHolder(1);
    globalScene.applyModifiers(PokemonMultiHitModifier, source.isPlayer(), source, move.id, null, multiStrikeEnhancementMultiplier);
    if (!ignoreSourceAbility) {
      applyPreAttackAbAttrs(AddSecondStrikeAbAttr, source, this, move, simulated, null, multiStrikeEnhancementMultiplier);
    }

    /** Doubles damage if this Pokemon's last move was Glaive Rush */
    const glaiveRushMultiplier = new Utils.NumberHolder(1);
    if (this.getTag(BattlerTagType.RECEIVE_DOUBLE_DAMAGE)) {
      glaiveRushMultiplier.value = 2;
    }

    /** The damage multiplier when the given move critically hits */
    const criticalMultiplier = new Utils.NumberHolder(isCritical ? 1.5 : 1);
    applyAbAttrs(MultCritAbAttr, source, null, simulated, criticalMultiplier);

    /**
     * A multiplier for random damage spread in the range [0.85, 1]
     * This is always 1 for simulated calls.
     */
    const randomMultiplier = simulated ? 1 : ((this.randSeedIntRange(85, 100)) / 100);

    const sourceTypes = source.getTypes();
    const sourceTeraType = source.getTeraType();
    const matchesSourceType = sourceTypes.includes(moveType);
    /** A damage multiplier for when the attack is of the attacker's type and/or Tera type. */
    const stabMultiplier = new Utils.NumberHolder(1);
    if (matchesSourceType && moveType !== Type.STELLAR) {
      stabMultiplier.value += 0.5;
    }

    if (!ignoreSourceAbility) {
      applyAbAttrs(StabBoostAbAttr, source, null, simulated, stabMultiplier);
    }

    applyMoveAttrs(CombinedPledgeStabBoostAttr, source, this, move, stabMultiplier);

    if (source.isTerastallized && sourceTeraType === moveType && moveType !== Type.STELLAR) {
      stabMultiplier.value += 0.5;
    }

    if (source.isTerastallized && source.getTeraType() === Type.STELLAR && (!source.stellarTypesBoosted.includes(moveType) || source.hasSpecies(Species.TERAPAGOS))) {
      if (matchesSourceType) {
        stabMultiplier.value += 0.5;
      } else {
        stabMultiplier.value += 0.2;
      }
    }

    stabMultiplier.value = Math.min(stabMultiplier.value, 2.25);

    /** Halves damage if the attacker is using a physical attack while burned */
    const burnMultiplier = new Utils.NumberHolder(1);
    if (isPhysical && source.status && source.status.effect === StatusEffect.BURN) {
      if (!move.hasAttr(BypassBurnDamageReductionAttr)) {
        const burnDamageReductionCancelled = new Utils.BooleanHolder(false);
        if (!ignoreSourceAbility) {
          applyAbAttrs(BypassBurnDamageReductionAbAttr, source, burnDamageReductionCancelled, simulated);
        }
        if (!burnDamageReductionCancelled.value) {
          burnMultiplier.value = 0.5;
        }
      }
    }

    /** Reduces damage if this Pokemon has a relevant screen (e.g. Light Screen for special attacks) */
    const screenMultiplier = new Utils.NumberHolder(1);
    globalScene.arena.applyTagsForSide(WeakenMoveScreenTag, defendingSide, simulated, source, moveCategory, screenMultiplier);

    /**
     * For each {@linkcode HitsTagAttr} the move has, doubles the damage of the move if:
     * The target has a {@linkcode BattlerTagType} that this move interacts with
     * AND
     * The move doubles damage when used against that tag
     */
    const hitsTagMultiplier = new Utils.NumberHolder(1);
    move.getAttrs(HitsTagAttr).filter(hta => hta.doubleDamage).forEach(hta => {
      if (this.getTag(hta.tagType)) {
        hitsTagMultiplier.value *= 2;
      }
    });

    /** Halves damage if this Pokemon is grounded in Misty Terrain against a Dragon-type attack */
    const mistyTerrainMultiplier = (globalScene.arena.terrain?.terrainType === TerrainType.MISTY && this.isGrounded() && moveType === Type.DRAGON)
      ? 0.5
      : 1;

    damage.value = Utils.toDmgValue(
      baseDamage
      * targetMultiplier
      * multiStrikeEnhancementMultiplier.value
      * arenaAttackTypeMultiplier.value
      * glaiveRushMultiplier.value
      * criticalMultiplier.value
      * randomMultiplier
      * stabMultiplier.value
      * typeMultiplier
      * burnMultiplier.value
      * screenMultiplier.value
      * hitsTagMultiplier.value
      * mistyTerrainMultiplier
    );

    /** Doubles damage if the attacker has Tinted Lens and is using a resisted move */
    if (!ignoreSourceAbility) {
      applyPreAttackAbAttrs(DamageBoostAbAttr, source, this, move, simulated, damage);
    }

    /** Apply the enemy's Damage and Resistance tokens */
    if (!source.isPlayer()) {
      globalScene.applyModifiers(EnemyDamageBoosterModifier, false, damage);
    }
    if (!this.isPlayer()) {
      globalScene.applyModifiers(EnemyDamageReducerModifier, false, damage);
    }


    /** Apply this Pokemon's post-calc defensive modifiers (e.g. Fur Coat) */
    if (!ignoreAbility) {
      applyPreDefendAbAttrs(ReceivedMoveDamageMultiplierAbAttr, this, source, move, cancelled, simulated, damage);

      /** Additionally apply friend guard damage reduction if ally has it. */
      if (globalScene.currentBattle.double && this.getAlly()?.isActive(true)) {
        applyPreDefendAbAttrs(AlliedFieldDamageReductionAbAttr, this.getAlly(), source, move, cancelled, simulated, damage);
      }
    }

    // This attribute may modify damage arbitrarily, so be careful about changing its order of application.
    applyMoveAttrs(ModifiedDamageAttr, source, this, move, damage);

    if (this.isFullHp() && !ignoreAbility) {
      applyPreDefendAbAttrs(PreDefendFullHpEndureAbAttr, this, source, move, cancelled, false, damage);
    }

    // debug message for when damage is applied (i.e. not simulated)
    if (!simulated) {
      console.log("damage", damage.value, move.name);
    }

    let hitResult: HitResult;
    if (typeMultiplier < 1) {
      hitResult = HitResult.NOT_VERY_EFFECTIVE;
    } else if (typeMultiplier > 1) {
      hitResult = HitResult.SUPER_EFFECTIVE;
    } else {
      hitResult = HitResult.EFFECTIVE;
    }

    return {
      cancelled: cancelled.value,
      result: hitResult,
      damage: damage.value
    };
  }

  /**
   * Applies the results of a move to this pokemon
   * @param source The {@linkcode Pokemon} using the move
   * @param move The {@linkcode Move} being used
   * @returns The {@linkcode HitResult} of the attack
   */
  apply(source: Pokemon, move: Move): HitResult {
    const defendingSide = this.isPlayer() ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY;
    const moveCategory = new Utils.NumberHolder(move.category);
    applyMoveAttrs(VariableMoveCategoryAttr, source, this, move, moveCategory);
    if (moveCategory.value === MoveCategory.STATUS) {
      const cancelled = new Utils.BooleanHolder(false);
      const typeMultiplier = this.getMoveEffectiveness(source, move, false, false, cancelled);

      if (!cancelled.value && typeMultiplier === 0) {
        globalScene.queueMessage(i18next.t("battle:hitResultNoEffect", { pokemonName: getPokemonNameWithAffix(this) }));
      }
      return (typeMultiplier === 0) ? HitResult.NO_EFFECT : HitResult.STATUS;
    } else {
      /** Determines whether the attack critically hits */
      let isCritical: boolean;
      const critOnly = new Utils.BooleanHolder(false);
      const critAlways = source.getTag(BattlerTagType.ALWAYS_CRIT);
      applyMoveAttrs(CritOnlyAttr, source, this, move, critOnly);
      applyAbAttrs(ConditionalCritAbAttr, source, null, false, critOnly, this, move);
      if (critOnly.value || critAlways) {
        isCritical = true;
      } else {
        const critChance = [ 24, 8, 2, 1 ][Math.max(0, Math.min(this.getCritStage(source, move), 3))];
        isCritical = critChance === 1 || !globalScene.randBattleSeedInt(critChance);
      }

      const noCritTag = globalScene.arena.getTagOnSide(NoCritTag, defendingSide);
      const blockCrit = new Utils.BooleanHolder(false);
      applyAbAttrs(BlockCritAbAttr, this, null, false, blockCrit);
      if (noCritTag || blockCrit.value || Overrides.NEVER_CRIT_OVERRIDE) {
        isCritical = false;
      }

      /**
       * Applies stat changes from {@linkcode move} and gives it to {@linkcode source}
       * before damage calculation
       */
      applyMoveAttrs(StatChangeBeforeDmgCalcAttr, source, this, move);

      const { cancelled, result, damage: dmg } = this.getAttackDamage(source, move, false, false, isCritical, false);

      const typeBoost = source.findTag(t => t instanceof TypeBoostTag && t.boostedType === source.getMoveType(move)) as TypeBoostTag;
      if (typeBoost?.oneUse) {
        source.removeTag(typeBoost.tagType);
      }

      if (cancelled || result === HitResult.IMMUNE || result === HitResult.NO_EFFECT) {
        source.stopMultiHit(this);

        if (!cancelled) {
          if (result === HitResult.IMMUNE) {
            globalScene.queueMessage(i18next.t("battle:hitResultImmune", { pokemonName: getPokemonNameWithAffix(this) }));
          } else {
            globalScene.queueMessage(i18next.t("battle:hitResultNoEffect", { pokemonName: getPokemonNameWithAffix(this) }));
          }
        }
        return result;
      }

      // In case of fatal damage, this tag would have gotten cleared before we could lapse it.
      const destinyTag = this.getTag(BattlerTagType.DESTINY_BOND);
      const grudgeTag = this.getTag(BattlerTagType.GRUDGE);

      const isOneHitKo = result === HitResult.ONE_HIT_KO;

      if (dmg) {
        this.lapseTags(BattlerTagLapseType.HIT);

        const substitute = this.getTag(SubstituteTag);
        const isBlockedBySubstitute = !!substitute && move.hitsSubstitute(source, this);
        if (isBlockedBySubstitute) {
          substitute.hp -= dmg;
        }
        if (!this.isPlayer() && dmg >= this.hp) {
          globalScene.applyModifiers(EnemyEndureChanceModifier, false, this);
        }

        /**
         * We explicitly require to ignore the faint phase here, as we want to show the messages
         * about the critical hit and the super effective/not very effective messages before the faint phase.
         */
        const damage = this.damageAndUpdate(isBlockedBySubstitute ? 0 : dmg, result as DamageResult, isCritical, isOneHitKo, isOneHitKo, true, source);

        if (damage > 0) {
          if (source.isPlayer()) {
            globalScene.validateAchvs(DamageAchv, new Utils.NumberHolder(damage));
            if (damage > globalScene.gameData.gameStats.highestDamage) {
              globalScene.gameData.gameStats.highestDamage = damage;
            }
          }
          source.turnData.totalDamageDealt += damage;
          source.turnData.singleHitDamageDealt = damage;
          this.turnData.damageTaken += damage;
          this.battleData.hitCount++;

          const attackResult = { move: move.id, result: result as DamageResult, damage: damage, critical: isCritical, sourceId: source.id, sourceBattlerIndex: source.getBattlerIndex() };
          this.turnData.attacksReceived.unshift(attackResult);
          if (source.isPlayer() && !this.isPlayer()) {
            globalScene.applyModifiers(DamageMoneyRewardModifier, true, source, new Utils.NumberHolder(damage));
          }
        }
      }

      if (isCritical) {
        globalScene.queueMessage(i18next.t("battle:hitResultCriticalHit"));
      }

      // want to include is.Fainted() in case multi hit move ends early, still want to render message
      if (source.turnData.hitsLeft === 1 || this.isFainted()) {
        switch (result) {
          case HitResult.SUPER_EFFECTIVE:
            globalScene.queueMessage(i18next.t("battle:hitResultSuperEffective"));
            break;
          case HitResult.NOT_VERY_EFFECTIVE:
            globalScene.queueMessage(i18next.t("battle:hitResultNotVeryEffective"));
            break;
          case HitResult.ONE_HIT_KO:
            globalScene.queueMessage(i18next.t("battle:hitResultOneHitKO"));
            break;
        }
      }

      if (this.isFainted()) {
        // set splice index here, so future scene queues happen before FaintedPhase
        globalScene.setPhaseQueueSplice();
        globalScene.unshiftPhase(new FaintPhase(this.getBattlerIndex(), isOneHitKo, destinyTag, grudgeTag, source));

        this.destroySubstitute();
        this.lapseTag(BattlerTagType.COMMANDED);
        this.resetSummonData();
      }

      return result;
    }
  }

  /**
   * Called by damageAndUpdate()
   * @param damage integer
   * @param ignoreSegments boolean, not currently used
   * @param preventEndure  used to update damage if endure or sturdy
   * @param ignoreFaintPhase  flag on wheter to add FaintPhase if pokemon after applying damage faints
   * @returns integer representing damage
   */
  damage(damage: number, ignoreSegments: boolean = false, preventEndure: boolean = false, ignoreFaintPhase: boolean = false): number {
    if (this.isFainted()) {
      return 0;
    }
    const surviveDamage = new Utils.BooleanHolder(false);

    if (!preventEndure && this.hp - damage <= 0) {
      if (this.hp >= 1 && this.getTag(BattlerTagType.ENDURING)) {
        surviveDamage.value = this.lapseTag(BattlerTagType.ENDURING);
      } else if (this.hp > 1 && this.getTag(BattlerTagType.STURDY)) {
        surviveDamage.value = this.lapseTag(BattlerTagType.STURDY);
      } else if (this.hp >= 1 && this.getTag(BattlerTagType.ENDURE_TOKEN)) {
        surviveDamage.value = this.lapseTag(BattlerTagType.ENDURE_TOKEN);
      }
      if (!surviveDamage.value) {
        globalScene.applyModifiers(SurviveDamageModifier, this.isPlayer(), this, surviveDamage);
      }
      if (surviveDamage.value) {
        damage = this.hp - 1;
      }
    }

    damage = Math.min(damage, this.hp);
    this.hp = this.hp - damage;
    if (this.isFainted() && !ignoreFaintPhase) {
      /**
       * When adding the FaintPhase, want to toggle future unshiftPhase() and queueMessage() calls
       * to appear before the FaintPhase (as FaintPhase will potentially end the encounter and add Phases such as
       * GameOverPhase, VictoryPhase, etc.. that will interfere with anything else that happens during this MoveEffectPhase)
       *
       * Once the MoveEffectPhase is over (and calls it's .end() function, shiftPhase() will reset the PhaseQueueSplice via clearPhaseQueueSplice() )
       */
      globalScene.setPhaseQueueSplice();
      globalScene.unshiftPhase(new FaintPhase(this.getBattlerIndex(), preventEndure));
      this.destroySubstitute();
      this.lapseTag(BattlerTagType.COMMANDED);
      this.resetSummonData();
    }
    return damage;
  }

  /**
   * Called by apply(), given the damage, adds a new DamagePhase and actually updates HP values, etc.
   * @param damage integer - passed to damage()
   * @param result an enum if it's super effective, not very, etc.
   * @param critical boolean if move is a critical hit
   * @param ignoreSegments boolean, passed to damage() and not used currently
   * @param preventEndure boolean, ignore endure properties of pokemon, passed to damage()
   * @param ignoreFaintPhase boolean to ignore adding a FaintPhase, passsed to damage()
   * @returns integer of damage done
   */
  damageAndUpdate(damage: number, result?: DamageResult, critical: boolean = false, ignoreSegments: boolean = false, preventEndure: boolean = false, ignoreFaintPhase: boolean = false, source?: Pokemon): number {
    const damagePhase = new DamageAnimPhase(this.getBattlerIndex(), damage, result as DamageResult, critical);
    globalScene.unshiftPhase(damagePhase);
    if (this.switchOutStatus && source) {
      damage = 0;
    }
    damage = this.damage(damage, ignoreSegments, preventEndure, ignoreFaintPhase);
    // Damage amount may have changed, but needed to be queued before calling damage function
    damagePhase.updateAmount(damage);
    /**
     * Run PostDamageAbAttr from any source of damage that is not from a multi-hit
     * Multi-hits are handled in move-effect-phase.ts for PostDamageAbAttr
     */
    if (!source || source.turnData.hitCount <= 1) {
      applyPostDamageAbAttrs(PostDamageAbAttr, this, damage, this.hasPassive(), false, [], source);
    }
    return damage;
  }

  heal(amount: number): number {
    const healAmount = Math.min(amount, this.getMaxHp() - this.hp);
    this.hp += healAmount;
    return healAmount;
  }

  isBossImmune(): boolean {
    return this.isBoss();
  }

  isMax(): boolean {
    const maxForms = [ SpeciesFormKey.GIGANTAMAX, SpeciesFormKey.GIGANTAMAX_RAPID, SpeciesFormKey.GIGANTAMAX_SINGLE, SpeciesFormKey.ETERNAMAX ] as string[];
    return maxForms.includes(this.getFormKey()) || (!!this.getFusionFormKey() && maxForms.includes(this.getFusionFormKey()!));
  }

  canAddTag(tagType: BattlerTagType): boolean {
    if (this.getTag(tagType)) {
      return false;
    }

    const stubTag = new BattlerTag(tagType, 0, 0);

    const cancelled = new Utils.BooleanHolder(false);
    applyPreApplyBattlerTagAbAttrs(BattlerTagImmunityAbAttr, this, stubTag, cancelled, true);

    const userField = this.getAlliedField();
    userField.forEach(pokemon => applyPreApplyBattlerTagAbAttrs(UserFieldBattlerTagImmunityAbAttr, pokemon, stubTag, cancelled, true));

    return !cancelled.value;
  }

  addTag(tagType: BattlerTagType, turnCount: number = 0, sourceMove?: Moves, sourceId?: number): boolean {
    const existingTag = this.getTag(tagType);
    if (existingTag) {
      existingTag.onOverlap(this);
      return false;
    }

    const newTag = getBattlerTag(tagType, turnCount, sourceMove!, sourceId!); // TODO: are the bangs correct?

    const cancelled = new Utils.BooleanHolder(false);
    applyPreApplyBattlerTagAbAttrs(BattlerTagImmunityAbAttr, this, newTag, cancelled);

    const userField = this.getAlliedField();
    userField.forEach(pokemon => applyPreApplyBattlerTagAbAttrs(UserFieldBattlerTagImmunityAbAttr, pokemon, newTag, cancelled));

    if (!cancelled.value && newTag.canAdd(this)) {
      this.summonData.tags.push(newTag);
      newTag.onAdd(this);

      return true;
    }

    return false;
  }

  /** @overload */
  getTag(tagType: BattlerTagType): BattlerTag | nil;

  /** @overload */
  getTag<T extends BattlerTag>(tagType: Constructor<T>): T | nil;

  getTag(tagType: BattlerTagType | Constructor<BattlerTag>): BattlerTag | nil {
    if (!this.summonData) {
      return null;
    }
    return (tagType instanceof Function
      ? this.summonData.tags.find(t => t instanceof tagType)
      : this.summonData.tags.find(t => t.tagType === tagType)
    );
  }

  findTag(tagFilter: ((tag: BattlerTag) => boolean)) {
    if (!this.summonData) {
      return null;
    }
    return this.summonData.tags.find(t => tagFilter(t));
  }

  findTags(tagFilter: ((tag: BattlerTag) => boolean)): BattlerTag[] {
    if (!this.summonData) {
      return [];
    }
    return this.summonData.tags.filter(t => tagFilter(t));
  }

  lapseTag(tagType: BattlerTagType): boolean {
    if (!this.summonData) {
      return false;
    }
    const tags = this.summonData.tags;
    const tag = tags.find(t => t.tagType === tagType);
    if (tag && !(tag.lapse(this, BattlerTagLapseType.CUSTOM))) {
      tag.onRemove(this);
      tags.splice(tags.indexOf(tag), 1);
    }
    return !!tag;
  }

  lapseTags(lapseType: BattlerTagLapseType): void {
    if (!this.summonData) {
      return;
    }
    const tags = this.summonData.tags;
    tags.filter(t => lapseType === BattlerTagLapseType.FAINT || ((t.lapseTypes.some(lType => lType === lapseType)) && !(t.lapse(this, lapseType)))).forEach(t => {
      t.onRemove(this);
      tags.splice(tags.indexOf(t), 1);
    });
  }

  removeTag(tagType: BattlerTagType): boolean {
    if (!this.summonData) {
      return false;
    }
    const tags = this.summonData.tags;
    const tag = tags.find(t => t.tagType === tagType);
    if (tag) {
      tag.onRemove(this);
      tags.splice(tags.indexOf(tag), 1);
    }
    return !!tag;
  }

  findAndRemoveTags(tagFilter: ((tag: BattlerTag) => boolean)): boolean {
    if (!this.summonData) {
      return false;
    }
    const tags = this.summonData.tags;
    const tagsToRemove = tags.filter(t => tagFilter(t));
    for (const tag of tagsToRemove) {
      tag.turnCount = 0;
      tag.onRemove(this);
      tags.splice(tags.indexOf(tag), 1);
    }
    return true;
  }

  removeTagsBySourceId(sourceId: number): void {
    this.findAndRemoveTags(t => t.isSourceLinked() && t.sourceId === sourceId);
  }

  transferTagsBySourceId(sourceId: number, newSourceId: number): void {
    if (!this.summonData) {
      return;
    }
    const tags = this.summonData.tags;
    tags.filter(t => t.sourceId === sourceId).forEach(t => t.sourceId = newSourceId);
  }

  /**
   * Transferring stat changes and Tags
   * @param source {@linkcode Pokemon} the pokemon whose stats/Tags are to be passed on from, ie: the Pokemon using Baton Pass
   */
  transferSummon(source: Pokemon): void {
    // Copy all stat stages
    for (const s of BATTLE_STATS) {
      const sourceStage = source.getStatStage(s);
      if ((this instanceof PlayerPokemon) && (sourceStage === 6)) {
        globalScene.validateAchv(achvs.TRANSFER_MAX_STAT_STAGE);
      }
      this.setStatStage(s, sourceStage);
    }

    for (const tag of source.summonData.tags) {
      if (!tag.isBatonPassable || (tag.tagType === BattlerTagType.TELEKINESIS && this.species.speciesId === Species.GENGAR && this.getFormKey() === "mega")) {
        continue;
      }

      if (tag instanceof PowerTrickTag) {
        tag.swapStat(this);
      }

      this.summonData.tags.push(tag);
    }

    this.updateInfo();
  }

  /**
   * Gets whether the given move is currently disabled for this Pokemon.
   *
   * @param {Moves} moveId {@linkcode Moves} ID of the move to check
   * @returns {boolean} `true` if the move is disabled for this Pokemon, otherwise `false`
   *
   * @see {@linkcode MoveRestrictionBattlerTag}
   */
  public isMoveRestricted(moveId: Moves, pokemon?: Pokemon): boolean {
    return this.getRestrictingTag(moveId, pokemon) !== null;
  }

  /**
   * Gets whether the given move is currently disabled for the user based on the player's target selection
   *
   * @param {Moves} moveId {@linkcode Moves} ID of the move to check
   * @param {Pokemon} user {@linkcode Pokemon} the move user
   * @param {Pokemon} target {@linkcode Pokemon} the target of the move
   *
   * @returns {boolean} `true` if the move is disabled for this Pokemon due to the player's target selection
   *
   * @see {@linkcode MoveRestrictionBattlerTag}
   */
  isMoveTargetRestricted(moveId: Moves, user: Pokemon, target: Pokemon): boolean {
    for (const tag of this.findTags(t => t instanceof MoveRestrictionBattlerTag)) {
      if ((tag as MoveRestrictionBattlerTag).isMoveTargetRestricted(moveId, user, target)) {
        return (tag as MoveRestrictionBattlerTag !== null);
      }
    }
    return false;
  }

  /**
   * Gets the {@link MoveRestrictionBattlerTag} that is restricting a move, if it exists.
   *
   * @param {Moves} moveId {@linkcode Moves} ID of the move to check
   * @param {Pokemon} user {@linkcode Pokemon} the move user, optional and used when the target is a factor in the move's restricted status
   * @param {Pokemon} target {@linkcode Pokemon} the target of the move, optional and used when the target is a factor in the move's restricted status
   * @returns {MoveRestrictionBattlerTag | null} the first tag on this Pokemon that restricts the move, or `null` if the move is not restricted.
   */
  getRestrictingTag(moveId: Moves, user?: Pokemon, target?: Pokemon): MoveRestrictionBattlerTag | null {
    for (const tag of this.findTags(t => t instanceof MoveRestrictionBattlerTag)) {
      if ((tag as MoveRestrictionBattlerTag).isMoveRestricted(moveId, user)) {
        return tag as MoveRestrictionBattlerTag;
      } else if (user && target && (tag as MoveRestrictionBattlerTag).isMoveTargetRestricted(moveId, user, target)) {
        return tag as MoveRestrictionBattlerTag;
      }
    }
    return null;
  }

  public getMoveHistory(): TurnMove[] {
    return this.battleSummonData.moveHistory;
  }

  public pushMoveHistory(turnMove: TurnMove): void {
    if (!this.isOnField()) {
      return;
    }
    turnMove.turn = globalScene.currentBattle?.turn;
    this.getMoveHistory().push(turnMove);
  }

  /**
   * Returns a list of the most recent move entries in this Pokemon's move history.
   * The retrieved move entries are sorted in order from NEWEST to OLDEST.
   * @param moveCount The number of move entries to retrieve.
   *   If negative, retrieve the Pokemon's entire move history (equivalent to reversing the output of {@linkcode getMoveHistory()}).
   *   Default is `1`.
   * @returns A list of {@linkcode TurnMove}, as specified above.
   */
  getLastXMoves(moveCount: number = 1): TurnMove[] {
    const moveHistory = this.getMoveHistory();
    if (moveCount >= 0) {
      return moveHistory.slice(Math.max(moveHistory.length - moveCount, 0)).reverse();
    } else {
      return moveHistory.slice(0).reverse();
    }
  }

  getMoveQueue(): TurnMove[] {
    return this.summonData.moveQueue;
  }

  /**
   * If this Pokemon is using a multi-hit move, cancels all subsequent strikes
   * @param {Pokemon} target If specified, this only cancels subsequent strikes against the given target
   */
  stopMultiHit(target?: Pokemon): void {
    const effectPhase = globalScene.getCurrentPhase();
    if (effectPhase instanceof MoveEffectPhase && effectPhase.getUserPokemon() === this) {
      effectPhase.stopMultiHit(target);
    }
  }

  changeForm(formChange: SpeciesFormChange): Promise<void> {
    return new Promise(resolve => {
      this.formIndex = Math.max(this.species.forms.findIndex(f => f.formKey === formChange.formKey), 0);
      this.generateName();
      const abilityCount = this.getSpeciesForm().getAbilityCount();
      if (this.abilityIndex >= abilityCount) {// Shouldn't happen
        this.abilityIndex = abilityCount - 1;
      }
      globalScene.gameData.setPokemonSeen(this, false);
      this.setScale(this.getSpriteScale());
      this.loadAssets().then(() => {
        this.calculateStats();
        globalScene.updateModifiers(this.isPlayer(), true);
        Promise.all([ this.updateInfo(), globalScene.updateFieldScale() ]).then(() => resolve());
      });
    });
  }

  cry(soundConfig?: Phaser.Types.Sound.SoundConfig, sceneOverride?: BattleScene): AnySound {
    const scene = sceneOverride ?? globalScene; // TODO: is `sceneOverride` needed?
    const cry = this.getSpeciesForm().cry(soundConfig);
    let duration = cry.totalDuration * 1000;
    if (this.fusionSpecies && this.getSpeciesForm() !== this.getFusionSpeciesForm()) {
      let fusionCry = this.getFusionSpeciesForm().cry(soundConfig, true);
      duration = Math.min(duration, fusionCry.totalDuration * 1000);
      fusionCry.destroy();
      scene.time.delayedCall(Utils.fixedInt(Math.ceil(duration * 0.4)), () => {
        try {
          SoundFade.fadeOut(scene, cry, Utils.fixedInt(Math.ceil(duration * 0.2)));
          fusionCry = this.getFusionSpeciesForm().cry(Object.assign({ seek: Math.max(fusionCry.totalDuration * 0.4, 0) }, soundConfig));
          SoundFade.fadeIn(scene, fusionCry, Utils.fixedInt(Math.ceil(duration * 0.2)), scene.masterVolume * scene.fieldVolume, 0);
        } catch (err) {
          console.error(err);
        }
      });
    }

    return cry;
  }

  faintCry(callback: Function): void {
    if (this.fusionSpecies && this.getSpeciesForm() !== this.getFusionSpeciesForm()) {
      return this.fusionFaintCry(callback);
    }

    const key = this.species.getCryKey(this.formIndex);
    let rate = 0.85;
    const cry = globalScene.playSound(key, { rate: rate }) as AnySound;
    if (!cry || globalScene.fieldVolume === 0) {
      return callback();
    }
    const sprite = this.getSprite();
    const tintSprite = this.getTintSprite();
    const delay = Math.max(globalScene.sound.get(key).totalDuration * 50, 25);

    let frameProgress = 0;
    let frameThreshold: number;

    sprite.anims.pause();
    tintSprite?.anims.pause();

    let faintCryTimer : Phaser.Time.TimerEvent | null = globalScene.time.addEvent({
      delay: Utils.fixedInt(delay),
      repeat: -1,
      callback: () => {
        frameThreshold = sprite.anims.msPerFrame / rate;
        frameProgress += delay;
        while (frameProgress > frameThreshold) {
          if (sprite.anims.duration) {
            sprite.anims.nextFrame();
            tintSprite?.anims.nextFrame();
          }
          frameProgress -= frameThreshold;
        }
        if (cry && !cry.pendingRemove) {
          rate *= 0.99;
          cry.setRate(rate);
        } else {
          faintCryTimer?.destroy();
          faintCryTimer = null;
          if (callback) {
            callback();
          }
        }
      }
    });

    // Failsafe
    globalScene.time.delayedCall(Utils.fixedInt(3000), () => {
      if (!faintCryTimer || !globalScene) {
        return;
      }
      if (cry?.isPlaying) {
        cry.stop();
      }
      faintCryTimer.destroy();
      if (callback) {
        callback();
      }
    });
  }

  private fusionFaintCry(callback: Function): void {
    const key = this.species.getCryKey(this.formIndex);
    let i = 0;
    let rate = 0.85;
    const cry = globalScene.playSound(key, { rate: rate }) as AnySound;
    const sprite = this.getSprite();
    const tintSprite = this.getTintSprite();
    let duration = cry.totalDuration * 1000;

    const fusionCryKey = this.fusionSpecies!.getCryKey(this.fusionFormIndex);
    let fusionCry = globalScene.playSound(fusionCryKey, { rate: rate }) as AnySound;
    if (!cry || !fusionCry || globalScene.fieldVolume === 0) {
      return callback();
    }
    fusionCry.stop();
    duration = Math.min(duration, fusionCry.totalDuration * 1000);
    fusionCry.destroy();
    const delay = Math.max(duration * 0.05, 25);

    let transitionIndex = 0;
    let durationProgress = 0;

    const transitionThreshold = Math.ceil(duration * 0.4);
    while (durationProgress < transitionThreshold) {
      ++i;
      durationProgress += delay * rate;
      rate *= 0.99;
    }

    transitionIndex = i;

    i = 0;
    rate = 0.85;

    let frameProgress = 0;
    let frameThreshold: number;

    sprite.anims.pause();
    tintSprite?.anims.pause();

    let faintCryTimer: Phaser.Time.TimerEvent | null = globalScene.time.addEvent({
      delay: Utils.fixedInt(delay),
      repeat: -1,
      callback: () => {
        ++i;
        frameThreshold = sprite.anims.msPerFrame / rate;
        frameProgress += delay;
        while (frameProgress > frameThreshold) {
          if (sprite.anims.duration) {
            sprite.anims.nextFrame();
            tintSprite?.anims.nextFrame();
          }
          frameProgress -= frameThreshold;
        }
        if (i === transitionIndex && fusionCryKey) {
          SoundFade.fadeOut(globalScene, cry, Utils.fixedInt(Math.ceil((duration / rate) * 0.2)));
          fusionCry = globalScene.playSound(fusionCryKey, Object.assign({ seek: Math.max(fusionCry.totalDuration * 0.4, 0), rate: rate }));
          SoundFade.fadeIn(globalScene, fusionCry, Utils.fixedInt(Math.ceil((duration / rate) * 0.2)), globalScene.masterVolume * globalScene.fieldVolume, 0);
        }
        rate *= 0.99;
        if (cry && !cry.pendingRemove) {
          cry.setRate(rate);
        }
        if (fusionCry && !fusionCry.pendingRemove) {
          fusionCry.setRate(rate);
        }
        if ((!cry || cry.pendingRemove) && (!fusionCry || fusionCry.pendingRemove)) {
          faintCryTimer?.destroy();
          faintCryTimer = null;
          if (callback) {
            callback();
          }
        }
      }
    });

    // Failsafe
    globalScene.time.delayedCall(Utils.fixedInt(3000), () => {
      if (!faintCryTimer || !globalScene) {
        return;
      }
      if (cry?.isPlaying) {
        cry.stop();
      }
      if (fusionCry?.isPlaying) {
        fusionCry.stop();
      }
      faintCryTimer.destroy();
      if (callback) {
        callback();
      }
    });
  }

  isOppositeGender(pokemon: Pokemon): boolean {
    return this.gender !== Gender.GENDERLESS && pokemon.gender === (this.gender === Gender.MALE ? Gender.FEMALE : Gender.MALE);
  }

  /**
   * Checks if a status effect can be applied to the Pokemon.
   *
   * @param effect The {@linkcode StatusEffect} whose applicability is being checked
   * @param quiet Whether in-battle messages should trigger or not
   * @param overrideStatus Whether the Pokemon's current status can be overriden
   * @param sourcePokemon The Pokemon that is setting the status effect
   * @param ignoreField Whether any field effects (weather, terrain, etc.) should be considered
   */
  canSetStatus(effect: StatusEffect | undefined, quiet: boolean = false, overrideStatus: boolean = false, sourcePokemon: Pokemon | null = null, ignoreField: boolean = false): boolean {
    if (effect !== StatusEffect.FAINT) {
      if (overrideStatus ? this.status?.effect === effect : this.status) {
        return false;
      }
      if (this.isGrounded() && (!ignoreField && globalScene.arena.terrain?.terrainType === TerrainType.MISTY)) {
        return false;
      }
    }

    if (sourcePokemon && sourcePokemon !== this && this.isSafeguarded(sourcePokemon)) {
      return false;
    }

    const types = this.getTypes(true, true);

    switch (effect) {
      case StatusEffect.POISON:
      case StatusEffect.TOXIC:
      // Check if the Pokemon is immune to Poison/Toxic or if the source pokemon is canceling the immunity
        const poisonImmunity = types.map(defType => {
        // Check if the Pokemon is not immune to Poison/Toxic
          if (defType !== Type.POISON && defType !== Type.STEEL) {
            return false;
          }

          // Check if the source Pokemon has an ability that cancels the Poison/Toxic immunity
          const cancelImmunity = new Utils.BooleanHolder(false);
          if (sourcePokemon) {
            applyAbAttrs(IgnoreTypeStatusEffectImmunityAbAttr, sourcePokemon, cancelImmunity, false, effect, defType);
            if (cancelImmunity.value) {
              return false;
            }
          }

          return true;
        });

        if (this.isOfType(Type.POISON) || this.isOfType(Type.STEEL)) {
          if (poisonImmunity.includes(true)) {
            return false;
          }
        }
        break;
      case StatusEffect.PARALYSIS:
        if (this.isOfType(Type.ELECTRIC)) {
          return false;
        }
        break;
      case StatusEffect.SLEEP:
        if (this.isGrounded() && globalScene.arena.terrain?.terrainType === TerrainType.ELECTRIC) {
          return false;
        }
        break;
      case StatusEffect.FREEZE:
        if (this.isOfType(Type.ICE) || (!ignoreField && (globalScene?.arena?.weather?.weatherType && [ WeatherType.SUNNY, WeatherType.HARSH_SUN ].includes(globalScene.arena.weather.weatherType)))) {
          return false;
        }
        break;
      case StatusEffect.BURN:
        if (this.isOfType(Type.FIRE)) {
          return false;
        }
        break;
    }

    const cancelled = new Utils.BooleanHolder(false);
    applyPreSetStatusAbAttrs(StatusEffectImmunityAbAttr, this, effect, cancelled, quiet);

    const userField = this.getAlliedField();
    userField.forEach(pokemon => applyPreSetStatusAbAttrs(UserFieldStatusEffectImmunityAbAttr, pokemon, effect, cancelled, quiet));

    if (cancelled.value) {
      return false;
    }

    return true;
  }

  trySetStatus(effect?: StatusEffect, asPhase: boolean = false, sourcePokemon: Pokemon | null = null, turnsRemaining: number = 0, sourceText: string | null = null): boolean {
    if (!this.canSetStatus(effect, asPhase, false, sourcePokemon)) {
      return false;
    }
    if (this.isFainted() && effect !== StatusEffect.FAINT) {
      return false;
    }

    /**
     * If this Pokemon falls asleep or freezes in the middle of a multi-hit attack,
     * cancel the attack's subsequent hits.
     */
    if (effect === StatusEffect.SLEEP || effect === StatusEffect.FREEZE) {
      this.stopMultiHit();
    }

    if (asPhase) {
      globalScene.unshiftPhase(new ObtainStatusEffectPhase(this.getBattlerIndex(), effect, turnsRemaining, sourceText, sourcePokemon));
      return true;
    }

    let sleepTurnsRemaining: Utils.NumberHolder;

    if (effect === StatusEffect.SLEEP) {
      sleepTurnsRemaining = new Utils.NumberHolder(this.randSeedIntRange(2, 4));

      this.setFrameRate(4);

      // If the user is invulnerable, lets remove their invulnerability when they fall asleep
      const invulnerableTags = [
        BattlerTagType.UNDERGROUND,
        BattlerTagType.UNDERWATER,
        BattlerTagType.HIDDEN,
        BattlerTagType.FLYING
      ];

      const tag = invulnerableTags.find((t) => this.getTag(t));

      if (tag) {
        this.removeTag(tag);
        this.getMoveQueue().pop();
      }
    }

    sleepTurnsRemaining = sleepTurnsRemaining!; // tell TS compiler it's defined
    effect = effect!; // If `effect` is undefined then `trySetStatus()` will have already returned early via the `canSetStatus()` call
    this.status = new Status(effect, 0, sleepTurnsRemaining?.value);

    if (effect !== StatusEffect.FAINT) {
      globalScene.triggerPokemonFormChange(this, SpeciesFormChangeStatusEffectTrigger, true);
      applyPostSetStatusAbAttrs(PostSetStatusAbAttr, this, effect, sourcePokemon);
    }

    return true;
  }

  /**
  * Resets the status of a pokemon.
  * @param revive Whether revive should be cured; defaults to true.
  * @param confusion Whether resetStatus should include confusion or not; defaults to false.
  * @param reloadAssets Whether to reload the assets or not; defaults to false.
  */
  resetStatus(revive: boolean = true, confusion: boolean = false, reloadAssets: boolean = false): void {
    const lastStatus = this.status?.effect;
    if (!revive && lastStatus === StatusEffect.FAINT) {
      return;
    }
    this.status = null;
    if (lastStatus === StatusEffect.SLEEP) {
      this.setFrameRate(10);
      if (this.getTag(BattlerTagType.NIGHTMARE)) {
        this.lapseTag(BattlerTagType.NIGHTMARE);
      }
    }
    if (confusion) {
      if (this.getTag(BattlerTagType.CONFUSED)) {
        this.lapseTag(BattlerTagType.CONFUSED);
      }
    }
    if (reloadAssets) {
      this.loadAssets(false).then(() => this.playAnim());
    }
  }

  /**
   * Checks if this Pokemon is protected by Safeguard
   * @param attacker the {@linkcode Pokemon} inflicting status on this Pokemon
   * @returns `true` if this Pokemon is protected by Safeguard; `false` otherwise.
   */
  isSafeguarded(attacker: Pokemon): boolean {
    const defendingSide = this.isPlayer() ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY;
    if (globalScene.arena.getTagOnSide(ArenaTagType.SAFEGUARD, defendingSide)) {
      const bypassed = new Utils.BooleanHolder(false);
      if (attacker) {
        applyAbAttrs(InfiltratorAbAttr, attacker, null, false, bypassed);
      }
      return !bypassed.value;
    }
    return false;
  }

  primeSummonData(summonDataPrimer: PokemonSummonData): void {
    this.summonDataPrimer = summonDataPrimer;
  }

  resetSummonData(): void {
    if (this.summonData?.speciesForm) {
      this.summonData.speciesForm = null;
      this.updateFusionPalette();
    }
    this.summonData = new PokemonSummonData();
    this.setSwitchOutStatus(false);
    if (!this.battleData) {
      this.resetBattleData();
    }
    this.resetBattleSummonData();
    if (this.summonDataPrimer) {
      for (const k of Object.keys(this.summonData)) {
        if (this.summonDataPrimer[k]) {
          this.summonData[k] = this.summonDataPrimer[k];
        }
      }
      // If this Pokemon has a Substitute when loading in, play an animation to add its sprite
      if (this.getTag(SubstituteTag)) {
        globalScene.triggerPokemonBattleAnim(this, PokemonAnimType.SUBSTITUTE_ADD);
        this.getTag(SubstituteTag)!.sourceInFocus = false;
      }

      // If this Pokemon has Commander and Dondozo as an active ally, hide this Pokemon's sprite.
      if (this.hasAbilityWithAttr(CommanderAbAttr)
          && globalScene.currentBattle.double
          && this.getAlly()?.species.speciesId === Species.DONDOZO) {
        this.setVisible(false);
      }
      this.summonDataPrimer = null;
    }
    this.updateInfo();
  }

  resetBattleData(): void {
    this.battleData = new PokemonBattleData();
  }

  resetBattleSummonData(): void {
    this.battleSummonData = new PokemonBattleSummonData();
    if (this.getTag(BattlerTagType.SEEDED)) {
      this.lapseTag(BattlerTagType.SEEDED);
    }
    if (globalScene) {
      globalScene.triggerPokemonFormChange(this, SpeciesFormChangePostMoveTrigger, true);
    }
  }

  resetTera(): void {
    const wasTerastallized = this.isTerastallized;
    this.isTerastallized = false;
    this.stellarTypesBoosted = [];
    if (wasTerastallized) {
      this.updateSpritePipelineData();
      globalScene.triggerPokemonFormChange(this, SpeciesFormChangeLapseTeraTrigger);
    }
  }

  resetTurnData(): void {
    this.turnData = new PokemonTurnData();
  }

  getExpValue(): number {
    // Logic to factor in victor level has been removed for balancing purposes, so the player doesn't have to focus on EXP maxxing
    return ((this.getSpeciesForm().getBaseExp() * this.level) / 5 + 1);
  }

  setFrameRate(frameRate: number) {
    globalScene.anims.get(this.getBattleSpriteKey()).frameRate = frameRate;
    try {
      this.getSprite().play(this.getBattleSpriteKey());
    } catch (err: unknown) {
      console.error(`Failed to play animation for ${this.getBattleSpriteKey()}`, err);
    }
    try {
      this.getTintSprite()?.play(this.getBattleSpriteKey());
    } catch (err: unknown) {
      console.error(`Failed to play animation for ${this.getBattleSpriteKey()}`, err);
    }
  }

  tint(color: number, alpha?: number, duration?: number, ease?: string) {
    const tintSprite = this.getTintSprite();
    tintSprite?.setTintFill(color);
    tintSprite?.setVisible(true);

    if (duration) {
      tintSprite?.setAlpha(0);

      globalScene.tweens.add({
        targets: tintSprite,
        alpha: alpha || 1,
        duration: duration,
        ease: ease || "Linear"
      });
    } else {
      tintSprite?.setAlpha(alpha);
    }
  }

  untint(duration: number, ease?: string) {
    const tintSprite = this.getTintSprite();

    if (duration) {
      globalScene.tweens.add({
        targets: tintSprite,
        alpha: 0,
        duration: duration,
        ease: ease || "Linear",
        onComplete: () => {
          tintSprite?.setVisible(false);
          tintSprite?.setAlpha(1);
        }
      });
    } else {
      tintSprite?.setVisible(false);
      tintSprite?.setAlpha(1);
    }
  }

  enableMask() {
    if (!this.maskEnabled) {
      this.maskSprite = this.getTintSprite();
      this.maskSprite?.setVisible(true);
      this.maskSprite?.setPosition(this.x * this.parentContainer.scale + this.parentContainer.x,
        this.y * this.parentContainer.scale + this.parentContainer.y);
      this.maskSprite?.setScale(this.getSpriteScale() * this.parentContainer.scale);
      this.maskEnabled = true;
    }
  }

  disableMask() {
    if (this.maskEnabled) {
      this.maskSprite?.setVisible(false);
      this.maskSprite?.setPosition(0, 0);
      this.maskSprite?.setScale(this.getSpriteScale());
      this.maskSprite = null;
      this.maskEnabled = false;
    }
  }

  sparkle(): void {
    if (this.shinySparkle) {
      doShinySparkleAnim(this.shinySparkle, this.variant);
    }
  }

  updateFusionPalette(ignoreOveride?: boolean): void {
    if (!this.getFusionSpeciesForm(ignoreOveride)) {
      [ this.getSprite(), this.getTintSprite() ].filter(s => !!s).map(s => {
        s.pipelineData[`spriteColors${ignoreOveride && this.summonData?.speciesForm ? "Base" : ""}`] = [];
        s.pipelineData[`fusionSpriteColors${ignoreOveride && this.summonData?.speciesForm ? "Base" : ""}`] = [];
      });
      return;
    }

    const speciesForm = this.getSpeciesForm(ignoreOveride);
    const fusionSpeciesForm = this.getFusionSpeciesForm(ignoreOveride);

    const spriteKey = speciesForm.getSpriteKey(this.getGender(ignoreOveride) === Gender.FEMALE, speciesForm.formIndex, this.shiny, this.variant);
    const backSpriteKey = speciesForm.getSpriteKey(this.getGender(ignoreOveride) === Gender.FEMALE, speciesForm.formIndex, this.shiny, this.variant).replace("pkmn__", "pkmn__back__");
    const fusionSpriteKey = fusionSpeciesForm.getSpriteKey(this.getFusionGender(ignoreOveride) === Gender.FEMALE, fusionSpeciesForm.formIndex, this.fusionShiny, this.fusionVariant);
    const fusionBackSpriteKey = fusionSpeciesForm.getSpriteKey(this.getFusionGender(ignoreOveride) === Gender.FEMALE, fusionSpeciesForm.formIndex, this.fusionShiny, this.fusionVariant).replace("pkmn__", "pkmn__back__");

    const sourceTexture = globalScene.textures.get(spriteKey);
    const sourceBackTexture = globalScene.textures.get(backSpriteKey);
    const fusionTexture = globalScene.textures.get(fusionSpriteKey);
    const fusionBackTexture = globalScene.textures.get(fusionBackSpriteKey);

    const [ sourceFrame, sourceBackFrame, fusionFrame, fusionBackFrame ] = [ sourceTexture, sourceBackTexture, fusionTexture, fusionBackTexture ].map(texture => texture.frames[texture.firstFrame]);
    const [ sourceImage, sourceBackImage, fusionImage, fusionBackImage ] = [ sourceTexture, sourceBackTexture, fusionTexture, fusionBackTexture ].map(i => i.getSourceImage() as HTMLImageElement);

    const canvas = document.createElement("canvas");
    const backCanvas = document.createElement("canvas");
    const fusionCanvas = document.createElement("canvas");
    const fusionBackCanvas = document.createElement("canvas");

    const spriteColors: number[][] = [];
    const pixelData: Uint8ClampedArray[] = [];

    [ canvas, backCanvas, fusionCanvas, fusionBackCanvas ].forEach((canv: HTMLCanvasElement, c: number) => {
      const context = canv.getContext("2d");
      const frame = [ sourceFrame, sourceBackFrame, fusionFrame, fusionBackFrame ][c];
      canv.width = frame.width;
      canv.height = frame.height;

      if (context) {
        context.drawImage([ sourceImage, sourceBackImage, fusionImage, fusionBackImage ][c], frame.cutX, frame.cutY, frame.width, frame.height, 0, 0, frame.width, frame.height);
        const imageData = context.getImageData(frame.cutX, frame.cutY, frame.width, frame.height);
        pixelData.push(imageData.data);
      }
    });

    for (let f = 0; f < 2; f++) {
      const variantColors = variantColorCache[!f ? spriteKey : backSpriteKey];
      const variantColorSet = new Map<number, number[]>();
      if (this.shiny && variantColors && variantColors[this.variant]) {
        Object.keys(variantColors[this.variant]).forEach(k => {
          variantColorSet.set(Utils.rgbaToInt(Array.from(Object.values(Utils.rgbHexToRgba(k)))), Array.from(Object.values(Utils.rgbHexToRgba(variantColors[this.variant][k]))));
        });
      }

      for (let i = 0; i < pixelData[f].length; i += 4) {
        if (pixelData[f][i + 3]) {
          const pixel = pixelData[f].slice(i, i + 4);
          let [ r, g, b, a ] = pixel;
          if (variantColors) {
            const color = Utils.rgbaToInt([ r, g, b, a ]);
            if (variantColorSet.has(color)) {
              const mappedPixel = variantColorSet.get(color);
              if (mappedPixel) {
                [ r, g, b, a ] = mappedPixel;
              }
            }
          }
          if (!spriteColors.find(c => c[0] === r && c[1] === g && c[2] === b)) {
            spriteColors.push([ r, g, b, a ]);
          }
        }
      }
    }

    const fusionSpriteColors = JSON.parse(JSON.stringify(spriteColors));

    const pixelColors: number[] = [];
    for (let f = 0; f < 2; f++) {
      for (let i = 0; i < pixelData[f].length; i += 4) {
        const total = pixelData[f].slice(i, i + 3).reduce((total: number, value: number) => total + value, 0);
        if (!total) {
          continue;
        }
        pixelColors.push(argbFromRgba({ r: pixelData[f][i], g: pixelData[f][i + 1], b: pixelData[f][i + 2], a: pixelData[f][i + 3] }));
      }
    }

    const fusionPixelColors : number[] = [];
    for (let f = 0; f < 2; f++) {
      const variantColors = variantColorCache[!f ? fusionSpriteKey : fusionBackSpriteKey];
      const variantColorSet = new Map<number, number[]>();
      if (this.fusionShiny && variantColors && variantColors[this.fusionVariant]) {
        Object.keys(variantColors[this.fusionVariant]).forEach(k => {
          variantColorSet.set(Utils.rgbaToInt(Array.from(Object.values(Utils.rgbHexToRgba(k)))), Array.from(Object.values(Utils.rgbHexToRgba(variantColors[this.fusionVariant][k]))));
        });
      }
      for (let i = 0; i < pixelData[2 + f].length; i += 4) {
        const total = pixelData[2 + f].slice(i, i + 3).reduce((total: number, value: number) => total + value, 0);
        if (!total) {
          continue;
        }
        let [ r, g, b, a ] = [ pixelData[2 + f][i], pixelData[2 + f][i + 1], pixelData[2 + f][i + 2], pixelData[2 + f][i + 3] ];
        if (variantColors) {
          const color = Utils.rgbaToInt([ r, g, b, a ]);
          if (variantColorSet.has(color)) {
            const mappedPixel = variantColorSet.get(color);
            if (mappedPixel) {
              [ r, g, b, a ] = mappedPixel;
            }
          }
        }
        fusionPixelColors.push(argbFromRgba({ r, g, b, a }));
      }
    }

    if (fusionPixelColors.length === 0) { // ERROR HANDLING IS NOT OPTIONAL BUDDY
      console.log("Failed to create fusion palette");
      return;
    }

    let paletteColors: Map<number, number>;
    let fusionPaletteColors: Map<number, number>;

    const originalRandom = Math.random;
    Math.random = () => Phaser.Math.RND.realInRange(0, 1);

    globalScene.executeWithSeedOffset(() => {
      paletteColors = QuantizerCelebi.quantize(pixelColors, 4);
      fusionPaletteColors = QuantizerCelebi.quantize(fusionPixelColors, 4);
    }, 0, "This result should not vary");

    Math.random = originalRandom;

    paletteColors = paletteColors!; // erroneously tell TS compiler that paletteColors is defined!
    fusionPaletteColors = fusionPaletteColors!; // mischievously misinform TS compiler that fusionPaletteColors is defined!
    const [ palette, fusionPalette ] = [ paletteColors, fusionPaletteColors ]
      .map(paletteColors => {
        let keys = Array.from(paletteColors.keys()).sort((a: number, b: number) => paletteColors.get(a)! < paletteColors.get(b)! ? 1 : -1);
        let rgbaColors: Map<number, number[]>;
        let hsvColors: Map<number, number[]>;

        const mappedColors = new Map<number, number[]>();

        do {
          mappedColors.clear();

          rgbaColors = keys.reduce((map: Map<number, number[]>, k: number) => {
            map.set(k, Object.values(rgbaFromArgb(k))); return map;
          }, new Map<number, number[]>());
          hsvColors = Array.from(rgbaColors.keys()).reduce((map: Map<number, number[]>, k: number) => {
            const rgb = rgbaColors.get(k)!.slice(0, 3);
            map.set(k, Utils.rgbToHsv(rgb[0], rgb[1], rgb[2]));
            return map;
          }, new Map<number, number[]>());

          for (let c = keys.length - 1; c >= 0; c--) {
            const hsv = hsvColors.get(keys[c])!;
            for (let c2 = 0; c2 < c; c2++) {
              const hsv2 = hsvColors.get(keys[c2])!;
              const diff = Math.abs(hsv[0] - hsv2[0]);
              if (diff < 30 || diff >= 330) {
                if (mappedColors.has(keys[c])) {
                  mappedColors.get(keys[c])!.push(keys[c2]);
                } else {
                  mappedColors.set(keys[c], [ keys[c2] ]);
                }
                break;
              }
            }
          }

          mappedColors.forEach((values: number[], key: number) => {
            const keyColor = rgbaColors.get(key)!;
            const valueColors = values.map(v => rgbaColors.get(v)!);
            const color = keyColor.slice(0);
            let count = paletteColors.get(key)!;
            for (const value of values) {
              const valueCount = paletteColors.get(value);
              if (!valueCount) {
                continue;
              }
              count += valueCount;
            }

            for (let c = 0; c < 3; c++) {
              color[c] *= (paletteColors.get(key)! / count);
              values.forEach((value: number, i: number) => {
                if (paletteColors.has(value)) {
                  const valueCount = paletteColors.get(value)!;
                  color[c] += valueColors[i][c] * (valueCount / count);
                }
              });
              color[c] = Math.round(color[c]);
            }

            paletteColors.delete(key);
            for (const value of values) {
              paletteColors.delete(value);
              if (mappedColors.has(value)) {
                mappedColors.delete(value);
              }
            }

            paletteColors.set(argbFromRgba({ r: color[0], g: color[1], b: color[2], a: color[3] }), count);
          });

          keys = Array.from(paletteColors.keys()).sort((a: number, b: number) => paletteColors.get(a)! < paletteColors.get(b)! ? 1 : -1);
        } while (mappedColors.size);

        return keys.map(c => Object.values(rgbaFromArgb(c)));
      }
      );

    const paletteDeltas: number[][] = [];

    spriteColors.forEach((sc: number[], i: number) => {
      paletteDeltas.push([]);
      for (let p = 0; p < palette.length; p++) {
        paletteDeltas[i].push(Utils.deltaRgb(sc, palette[p]));
      }
    });

    const easeFunc = Phaser.Tweens.Builders.GetEaseFunction("Cubic.easeIn");

    for (let sc = 0; sc < spriteColors.length; sc++) {
      const delta = Math.min(...paletteDeltas[sc]);
      const paletteIndex = Math.min(paletteDeltas[sc].findIndex(pd => pd === delta), fusionPalette.length - 1);
      if (delta < 255) {
        const ratio = easeFunc(delta / 255);
        const color = [ 0, 0, 0, fusionSpriteColors[sc][3] ];
        for (let c = 0; c < 3; c++) {
          color[c] = Math.round((fusionSpriteColors[sc][c] * ratio) + (fusionPalette[paletteIndex][c] * (1 - ratio)));
        }
        fusionSpriteColors[sc] = color;
      }
    }

    [ this.getSprite(), this.getTintSprite() ].filter(s => !!s).map(s => {
      s.pipelineData[`spriteColors${ignoreOveride && this.summonData?.speciesForm ? "Base" : ""}`] = spriteColors;
      s.pipelineData[`fusionSpriteColors${ignoreOveride && this.summonData?.speciesForm ? "Base" : ""}`] = fusionSpriteColors;
    });

    canvas.remove();
    fusionCanvas.remove();
  }

  /**
   * Generates a random number using the current battle's seed, or the global seed if `globalScene.currentBattle` is falsy
   * <!-- @import "../battle".Battle -->
   * This calls either {@linkcode BattleScene.randBattleSeedInt}({@linkcode range}, {@linkcode min}) in `src/battle-scene.ts`
   * which calls {@linkcode Battle.randSeedInt}({@linkcode range}, {@linkcode min}) in `src/battle.ts`
   * which calls {@linkcode Utils.randSeedInt randSeedInt}({@linkcode range}, {@linkcode min}) in `src/utils.ts`,
   * or it directly calls {@linkcode Utils.randSeedInt randSeedInt}({@linkcode range}, {@linkcode min}) in `src/utils.ts` if there is no current battle
   *
   * @param range How large of a range of random numbers to choose from. If {@linkcode range} <= 1, returns {@linkcode min}
   * @param min The minimum integer to pick, default `0`
   * @returns A random integer between {@linkcode min} and ({@linkcode min} + {@linkcode range} - 1)
   */
  randSeedInt(range: number, min: number = 0): number {
    return globalScene.currentBattle
      ? globalScene.randBattleSeedInt(range, min)
      : Utils.randSeedInt(range, min);
  }

  /**
   * Generates a random number using the current battle's seed, or the global seed if `globalScene.currentBattle` is falsy
   * @param min The minimum integer to generate
   * @param max The maximum integer to generate
   * @returns a random integer between {@linkcode min} and {@linkcode max} inclusive
   */
  randSeedIntRange(min: number, max: number): number {
    return this.randSeedInt((max - min) + 1, min);
  }

  /**
   * Causes a Pokemon to leave the field (such as in preparation for a switch out/escape).
   * @param clearEffects Indicates if effects should be cleared (true) or passed
   * to the next pokemon, such as during a baton pass (false)
   * @param hideInfo Indicates if this should also play the animation to hide the Pokemon's
   * info container.
   */
  leaveField(clearEffects: boolean = true, hideInfo: boolean = true, destroy: boolean = false) {
    this.resetSprite();
    this.resetTurnData();
    globalScene.getField(true).filter(p => p !== this).forEach(p => p.removeTagsBySourceId(this.id));

    if (clearEffects) {
      this.destroySubstitute();
      this.resetSummonData(); // this also calls `resetBattleSummonData`
    }
    if (hideInfo) {
      this.hideInfo();
    }
    // Trigger abilities that activate upon leaving the field
    applyPreLeaveFieldAbAttrs(PreLeaveFieldAbAttr, this);
    this.setSwitchOutStatus(true);
    globalScene.triggerPokemonFormChange(this, SpeciesFormChangeActiveTrigger, true);
    globalScene.field.remove(this, destroy);
  }

  destroy(): void {
    this.battleInfo?.destroy();
    this.destroySubstitute();
    super.destroy();
  }

  getBattleInfo(): BattleInfo {
    return this.battleInfo;
  }

  /**
   * Checks whether or not the Pokemon's root form has the same ability
   * @param abilityIndex the given ability index we are checking
   * @returns true if the abilities are the same
   */
  hasSameAbilityInRootForm(abilityIndex: number): boolean {
    const currentAbilityIndex = this.abilityIndex;
    const rootForm = getPokemonSpecies(this.species.getRootSpeciesId());
    return rootForm.getAbility(abilityIndex) === rootForm.getAbility(currentAbilityIndex);
  }

  /**
   * Helper function to check if the player already owns the starter data of the Pokemon's
   * current ability
   * @param ownedAbilityAttrs the owned abilityAttr of this Pokemon's root form
   * @returns true if the player already has it, false otherwise
   */
  checkIfPlayerHasAbilityOfStarter(ownedAbilityAttrs: number): boolean {
    if ((ownedAbilityAttrs & 1) > 0 && this.hasSameAbilityInRootForm(0)) {
      return true;
    }
    if ((ownedAbilityAttrs & 2) > 0 && this.hasSameAbilityInRootForm(1)) {
      return true;
    }
    if ((ownedAbilityAttrs & 4) > 0 && this.hasSameAbilityInRootForm(2)) {
      return true;
    }
    return false;
  }

  /**
   * Reduces one of this Pokemon's held item stacks by 1, and removes the item if applicable.
   * Does nothing if this Pokemon is somehow not the owner of the held item.
   * @param heldItem The item stack to be reduced by 1.
   * @param forBattle If `false`, do not trigger in-battle effects (such as Unburden) from losing the item. For example, set this to `false` if the Pokemon is giving away the held item for a Mystery Encounter. Default is `true`.
   * @returns `true` if the item was removed successfully, `false` otherwise.
   */
  public loseHeldItem(heldItem: PokemonHeldItemModifier, forBattle: boolean = true): boolean {
    if (heldItem.pokemonId === -1 || heldItem.pokemonId === this.id) {
      heldItem.stackCount--;
      if (heldItem.stackCount <= 0) {
        globalScene.removeModifier(heldItem, !this.isPlayer());
      }
      if (forBattle) {
        applyPostItemLostAbAttrs(PostItemLostAbAttr, this, false);
      }
      return true;
    } else {
      return false;
    }
  }
}

export class PlayerPokemon extends Pokemon {
  public compatibleTms: Moves[];

  constructor(species: PokemonSpecies, level: number, abilityIndex?: number, formIndex?: number, gender?: Gender, shiny?: boolean, variant?: Variant, ivs?: number[], nature?: Nature, dataSource?: Pokemon | PokemonData) {
    super(106, 148, species, level, abilityIndex, formIndex, gender, shiny, variant, ivs, nature, dataSource);

    if (Overrides.STATUS_OVERRIDE) {
      this.status = new Status(Overrides.STATUS_OVERRIDE, 0, 4);
    }

    if (Overrides.SHINY_OVERRIDE) {
      this.shiny = true;
      this.initShinySparkle();
    } else if (Overrides.SHINY_OVERRIDE === false) {
      this.shiny = false;
    }

    if (Overrides.VARIANT_OVERRIDE !== null && this.shiny) {
      this.variant = Overrides.VARIANT_OVERRIDE;
    }

    if (!dataSource) {
      if (globalScene.gameMode.isDaily) {
        this.generateAndPopulateMoveset();
      } else {
        this.moveset = [];
      }
    }
    this.generateCompatibleTms();
  }

  initBattleInfo(): void {
    this.battleInfo = new PlayerBattleInfo();
    this.battleInfo.initInfo(this);
  }

  isPlayer(): boolean {
    return true;
  }

  hasTrainer(): boolean {
    return true;
  }

  isBoss(): boolean {
    return false;
  }

  getFieldIndex(): number {
    return globalScene.getPlayerField().indexOf(this);
  }

  getBattlerIndex(): BattlerIndex {
    return this.getFieldIndex();
  }

  generateCompatibleTms(): void {
    this.compatibleTms = [];

    const tms = Object.keys(tmSpecies);
    for (const tm of tms) {
      const moveId = parseInt(tm) as Moves;
      let compatible = false;
      for (const p of tmSpecies[tm]) {
        if (Array.isArray(p)) {
          const [ pkm, form ] = p;
          if ((pkm === this.species.speciesId || this.fusionSpecies && pkm === this.fusionSpecies.speciesId) && form === this.getFormKey()) {
            compatible = true;
            break;
          }
        } else if (p === this.species.speciesId || (this.fusionSpecies && p === this.fusionSpecies.speciesId)) {
          compatible = true;
          break;
        }
      }
      if (reverseCompatibleTms.indexOf(moveId) > -1) {
        compatible = !compatible;
      }
      if (compatible) {
        this.compatibleTms.push(moveId);
      }
    }
  }

  tryPopulateMoveset(moveset: StarterMoveset): boolean {
    if (!this.getSpeciesForm().validateStarterMoveset(moveset, globalScene.gameData.starterData[this.species.getRootSpeciesId()].eggMoves)) {
      return false;
    }

    this.moveset = moveset.map(m => new PokemonMove(m));

    return true;
  }

  /**
   * Causes this mon to leave the field (via {@linkcode leaveField}) and then
   * opens the party switcher UI to switch a new mon in
   * @param switchType the {@linkcode SwitchType} for this switch-out. If this is
   * `BATON_PASS` or `SHED_TAIL`, this Pokemon's effects are not cleared upon leaving
   * the field.
   */
  switchOut(switchType: SwitchType = SwitchType.SWITCH): Promise<void> {
    return new Promise(resolve => {
      this.leaveField(switchType === SwitchType.SWITCH);

      globalScene.ui.setMode(Mode.PARTY, PartyUiMode.FAINT_SWITCH, this.getFieldIndex(), (slotIndex: number, option: PartyOption) => {
        if (slotIndex >= globalScene.currentBattle.getBattlerCount() && slotIndex < 6) {
          globalScene.prependToPhase(new SwitchSummonPhase(switchType, this.getFieldIndex(), slotIndex, false), MoveEndPhase);
        }
        globalScene.ui.setMode(Mode.MESSAGE).then(resolve);
      }, PartyUiHandler.FilterNonFainted);
    });
  }

  addFriendship(friendship: number): void {
    if (friendship > 0) {
      const starterSpeciesId = this.species.getRootSpeciesId();
      const fusionStarterSpeciesId = this.isFusion() && this.fusionSpecies ? this.fusionSpecies.getRootSpeciesId() : 0;
      const starterData = [
        globalScene.gameData.starterData[starterSpeciesId],
        fusionStarterSpeciesId ? globalScene.gameData.starterData[fusionStarterSpeciesId] : null
      ].filter(d => !!d);
      const amount = new Utils.NumberHolder(friendship);
      globalScene.applyModifier(PokemonFriendshipBoosterModifier, true, this, amount);
      const candyFriendshipMultiplier = globalScene.gameMode.isClassic ? globalScene.eventManager.getClassicFriendshipMultiplier() : 1;
      const fusionReduction = fusionStarterSpeciesId
        ? globalScene.eventManager.areFusionsBoosted() ? 1.5 // Divide candy gain for fusions by 1.5 during events
          : 2   // 2 for fusions outside events
        : 1;    // 1 for non-fused mons
      const starterAmount = new Utils.NumberHolder(Math.floor(amount.value * candyFriendshipMultiplier / fusionReduction));

      // Add friendship to this PlayerPokemon
      this.friendship = Math.min(this.friendship + amount.value, 255);
      if (this.friendship === 255) {
        globalScene.validateAchv(achvs.MAX_FRIENDSHIP);
      }
      // Add to candy progress for this mon's starter species and its fused species (if it has one)
      starterData.forEach((sd: StarterDataEntry, i: number) => {
        const speciesId = !i ? starterSpeciesId : fusionStarterSpeciesId as Species;
        sd.friendship = (sd.friendship || 0) + starterAmount.value;
        if (sd.friendship >= getStarterValueFriendshipCap(speciesStarterCosts[speciesId])) {
          globalScene.gameData.addStarterCandy(getPokemonSpecies(speciesId), 1);
          sd.friendship = 0;
        }
      });
    } else {
      // Lose friendship upon fainting
      this.friendship = Math.max(this.friendship + friendship, 0);
    }
  }

  getPossibleEvolution(evolution: SpeciesFormEvolution | null): Promise<Pokemon> {
    if (!evolution) {
      return new Promise(resolve => resolve(this));
    }
    return new Promise(resolve => {
      const evolutionSpecies = getPokemonSpecies(evolution.speciesId);
      const isFusion = evolution instanceof FusionSpeciesFormEvolution;
      let ret: PlayerPokemon;
      if (isFusion) {
        const originalFusionSpecies = this.fusionSpecies;
        const originalFusionFormIndex = this.fusionFormIndex;
        this.fusionSpecies = evolutionSpecies;
        this.fusionFormIndex = evolution.evoFormKey !== null ? Math.max(evolutionSpecies.forms.findIndex(f => f.formKey === evolution.evoFormKey), 0) : this.fusionFormIndex;
        ret = globalScene.addPlayerPokemon(this.species, this.level, this.abilityIndex, this.formIndex, this.gender, this.shiny, this.variant, this.ivs, this.nature, this);
        this.fusionSpecies = originalFusionSpecies;
        this.fusionFormIndex = originalFusionFormIndex;
      } else {
        const formIndex = evolution.evoFormKey !== null && !isFusion ? Math.max(evolutionSpecies.forms.findIndex(f => f.formKey === evolution.evoFormKey), 0) : this.formIndex;
        ret = globalScene.addPlayerPokemon(!isFusion ? evolutionSpecies : this.species, this.level, this.abilityIndex, formIndex, this.gender, this.shiny, this.variant, this.ivs, this.nature, this);
      }
      ret.loadAssets().then(() => resolve(ret));
    });
  }

  evolve(evolution: SpeciesFormEvolution | null, preEvolution: PokemonSpeciesForm): Promise<void> {
    if (!evolution) {
      return new Promise(resolve => resolve());
    }
    return new Promise(resolve => {
      this.pauseEvolutions = false;
      // Handles Nincada evolving into Ninjask + Shedinja
      this.handleSpecialEvolutions(evolution);
      const isFusion = evolution instanceof FusionSpeciesFormEvolution;
      if (!isFusion) {
        this.species = getPokemonSpecies(evolution.speciesId);
      } else {
        this.fusionSpecies = getPokemonSpecies(evolution.speciesId);
      }
      if (evolution.preFormKey !== null) {
        const formIndex = Math.max((!isFusion || !this.fusionSpecies ? this.species : this.fusionSpecies).forms.findIndex(f => f.formKey === evolution.evoFormKey), 0);
        if (!isFusion) {
          this.formIndex = formIndex;
        } else {
          this.fusionFormIndex = formIndex;
        }
      }
      this.generateName();
      if (!isFusion) {
        const abilityCount = this.getSpeciesForm().getAbilityCount();
        const preEvoAbilityCount = preEvolution.getAbilityCount();
        if ([ 0, 1, 2 ].includes(this.abilityIndex)) {
          // Handles cases where a Pokemon with 3 abilities evolves into a Pokemon with 2 abilities (ie: Eevee -> any Eeveelution)
          if (this.abilityIndex === 2 && preEvoAbilityCount === 3 && abilityCount === 2) {
            this.abilityIndex = 1;
          }
        } else { // Prevent pokemon with an illegal ability value from breaking things
          console.warn("this.abilityIndex is somehow an illegal value, please report this");
          console.warn(this.abilityIndex);
          this.abilityIndex = 0;
        }
      } else { // Do the same as above, but for fusions
        const abilityCount = this.getFusionSpeciesForm().getAbilityCount();
        const preEvoAbilityCount = preEvolution.getAbilityCount();
        if ([ 0, 1, 2 ].includes(this.fusionAbilityIndex)) {
          if (this.fusionAbilityIndex === 2 && preEvoAbilityCount === 3 && abilityCount === 2) {
            this.fusionAbilityIndex = 1;
          }
        } else {
          console.warn("this.fusionAbilityIndex is somehow an illegal value, please report this");
          console.warn(this.fusionAbilityIndex);
          this.fusionAbilityIndex = 0;
        }
      }
      this.compatibleTms.splice(0, this.compatibleTms.length);
      this.generateCompatibleTms();
      const updateAndResolve = () => {
        this.loadAssets().then(() => {
          this.calculateStats();
          this.updateInfo(true).then(() => resolve());
        });
      };
      if (preEvolution.speciesId === Species.GIMMIGHOUL) {
        const evotracker = this.getHeldItems().filter(m => m instanceof EvoTrackerModifier)[0] ?? null;
        if (evotracker) {
          globalScene.removeModifier(evotracker);
        }
      }
      if (!globalScene.gameMode.isDaily || this.metBiome > -1) {
        globalScene.gameData.updateSpeciesDexIvs(this.species.speciesId, this.ivs);
        globalScene.gameData.setPokemonSeen(this, false);
        globalScene.gameData.setPokemonCaught(this, false).then(() => updateAndResolve());
      } else {
        updateAndResolve();
      }
    });
  }

  private handleSpecialEvolutions(evolution: SpeciesFormEvolution) {
    const isFusion = evolution instanceof FusionSpeciesFormEvolution;

    const evoSpecies = (!isFusion ? this.species : this.fusionSpecies);
    if (evoSpecies?.speciesId === Species.NINCADA && evolution.speciesId === Species.NINJASK) {
      const newEvolution = pokemonEvolutions[evoSpecies.speciesId][1];

      if (newEvolution.condition?.predicate(this)) {
        const newPokemon = globalScene.addPlayerPokemon(this.species, this.level, this.abilityIndex, this.formIndex, undefined, this.shiny, this.variant, this.ivs, this.nature);
        newPokemon.passive = this.passive;
        newPokemon.moveset = this.moveset.slice();
        newPokemon.moveset = this.copyMoveset();
        newPokemon.luck = this.luck;
        newPokemon.gender = Gender.GENDERLESS;
        newPokemon.metLevel = this.metLevel;
        newPokemon.metBiome = this.metBiome;
        newPokemon.metSpecies = this.metSpecies;
        newPokemon.metWave = this.metWave;
        newPokemon.fusionSpecies = this.fusionSpecies;
        newPokemon.fusionFormIndex = this.fusionFormIndex;
        newPokemon.fusionAbilityIndex = this.fusionAbilityIndex;
        newPokemon.fusionShiny = this.fusionShiny;
        newPokemon.fusionVariant = this.fusionVariant;
        newPokemon.fusionGender = this.fusionGender;
        newPokemon.fusionLuck = this.fusionLuck;
        newPokemon.fusionTeraType = this.fusionTeraType;
        newPokemon.usedTMs = this.usedTMs;
        newPokemon.evoCounter = this.evoCounter;

        globalScene.getPlayerParty().push(newPokemon);
        newPokemon.evolve((!isFusion ? newEvolution : new FusionSpeciesFormEvolution(this.id, newEvolution)), evoSpecies);
        const modifiers = globalScene.findModifiers(m => m instanceof PokemonHeldItemModifier
          && m.pokemonId === this.id, true) as PokemonHeldItemModifier[];
        modifiers.forEach(m => {
          const clonedModifier = m.clone() as PokemonHeldItemModifier;
          clonedModifier.pokemonId = newPokemon.id;
          globalScene.addModifier(clonedModifier, true);
        });
        globalScene.updateModifiers(true);
      }
    }
  }

  getPossibleForm(formChange: SpeciesFormChange): Promise<Pokemon> {
    return new Promise(resolve => {
      const formIndex = Math.max(this.species.forms.findIndex(f => f.formKey === formChange.formKey), 0);
      const ret = globalScene.addPlayerPokemon(this.species, this.level, this.abilityIndex, formIndex, this.gender, this.shiny, this.variant, this.ivs, this.nature, this);
      ret.loadAssets().then(() => resolve(ret));
    });
  }

  changeForm(formChange: SpeciesFormChange): Promise<void> {
    return new Promise(resolve => {
      this.formIndex = Math.max(this.species.forms.findIndex(f => f.formKey === formChange.formKey), 0);
      this.generateName();
      const abilityCount = this.getSpeciesForm().getAbilityCount();
      if (this.abilityIndex >= abilityCount) { // Shouldn't happen
        this.abilityIndex = abilityCount - 1;
      }

      this.compatibleTms.splice(0, this.compatibleTms.length);
      this.generateCompatibleTms();
      const updateAndResolve = () => {
        this.loadAssets().then(() => {
          this.calculateStats();
          globalScene.updateModifiers(true, true);
          this.updateInfo(true).then(() => resolve());
        });
      };
      if (!globalScene.gameMode.isDaily || this.metBiome > -1) {
        globalScene.gameData.setPokemonSeen(this, false);
        globalScene.gameData.setPokemonCaught(this, false).then(() => updateAndResolve());
      } else {
        updateAndResolve();
      }
    });
  }

  clearFusionSpecies(): void {
    super.clearFusionSpecies();
    this.generateCompatibleTms();
  }

  /**
   * Returns a Promise to fuse two PlayerPokemon together
   * @param pokemon The PlayerPokemon to fuse to this one
   */
  fuse(pokemon: PlayerPokemon): void {
    this.fusionSpecies = pokemon.species;
    this.fusionFormIndex = pokemon.formIndex;
    this.fusionAbilityIndex = pokemon.abilityIndex;
    this.fusionShiny = pokemon.shiny;
    this.fusionVariant = pokemon.variant;
    this.fusionGender = pokemon.gender;
    this.fusionLuck = pokemon.luck;
    this.fusionCustomPokemonData = pokemon.customPokemonData;
    this.evoCounter = Math.max(pokemon.evoCounter, this.evoCounter);
    if (pokemon.pauseEvolutions || this.pauseEvolutions) {
      this.pauseEvolutions = true;
    }

    globalScene.validateAchv(achvs.SPLICE);
    globalScene.gameData.gameStats.pokemonFused++;

    // Store the average HP% that each Pokemon has
    const maxHp = this.getMaxHp();
    const newHpPercent = (pokemon.hp / pokemon.getMaxHp() + this.hp / maxHp) / 2;

    this.generateName();
    this.calculateStats();

    // Set this Pokemon's HP to the average % of both fusion components
    this.hp = Math.round(maxHp * newHpPercent);
    if (!this.isFainted()) {
      // If this Pokemon hasn't fainted, make sure the HP wasn't set over the new maximum
      this.hp = Math.min(this.hp, maxHp);
      this.status = getRandomStatus(this.status, pokemon.status); // Get a random valid status between the two
    } else if (!pokemon.isFainted()) {
      // If this Pokemon fainted but the other hasn't, make sure the HP wasn't set to zero
      this.hp = Math.max(this.hp, 1);
      this.status = pokemon.status; // Inherit the other Pokemon's status
    }

    this.generateCompatibleTms();
    this.updateInfo(true);
    const fusedPartyMemberIndex = globalScene.getPlayerParty().indexOf(pokemon);
    let partyMemberIndex = globalScene.getPlayerParty().indexOf(this);
    if (partyMemberIndex > fusedPartyMemberIndex) {
      partyMemberIndex--;
    }
    const fusedPartyMemberHeldModifiers = globalScene.findModifiers((m) => m instanceof PokemonHeldItemModifier && m.pokemonId === pokemon.id, true) as PokemonHeldItemModifier[];
    for (const modifier of fusedPartyMemberHeldModifiers) {
      globalScene.tryTransferHeldItemModifier(modifier, this, false, modifier.getStackCount(), true, true, false);
    }
    globalScene.updateModifiers(true, true);
    globalScene.removePartyMemberModifiers(fusedPartyMemberIndex);
    globalScene.getPlayerParty().splice(fusedPartyMemberIndex, 1)[0];
    const newPartyMemberIndex = globalScene.getPlayerParty().indexOf(this);
    pokemon.getMoveset(true).map((m: PokemonMove) => globalScene.unshiftPhase(new LearnMovePhase(newPartyMemberIndex, m.getMove().id)));
    pokemon.destroy();
    this.updateFusionPalette();
  }

  unfuse(): Promise<void> {
    return new Promise(resolve => {
      this.clearFusionSpecies();

      this.updateInfo(true).then(() => resolve());
      this.updateFusionPalette();
    });
  }

  /** Returns a deep copy of this Pokemon's moveset array */
  copyMoveset(): PokemonMove[] {
    const newMoveset : PokemonMove[] = [];
    this.moveset.forEach((move) => {
      // TODO: refactor `moveset` to not accept `null`s
      if (move) {
        newMoveset.push(new PokemonMove(move.moveId, 0, move.ppUp, move.virtual, move.maxPpOverride));
      }
    });

    return newMoveset;
  }
}

export class EnemyPokemon extends Pokemon {
  public trainerSlot: TrainerSlot;
  public aiType: AiType;
  public bossSegments: number;
  public bossSegmentIndex: number;
  public initialTeamIndex: number;
  /** To indicate if the instance was populated with a dataSource -> e.g. loaded & populated from session data */
  public readonly isPopulatedFromDataSource: boolean;

  constructor(species: PokemonSpecies, level: number, trainerSlot: TrainerSlot, boss: boolean, shinyLock: boolean = false, dataSource?: PokemonData) {
    super(236, 84, species, level, dataSource?.abilityIndex, dataSource?.formIndex, dataSource?.gender,
      (!shinyLock && dataSource) ? dataSource.shiny : false, (!shinyLock && dataSource) ? dataSource.variant : undefined,
      undefined, dataSource ? dataSource.nature : undefined, dataSource);

    this.trainerSlot = trainerSlot;
    this.initialTeamIndex = globalScene.currentBattle?.enemyParty.length ?? 0;
    this.isPopulatedFromDataSource = !!dataSource; // if a dataSource is provided, then it was populated from dataSource
    if (boss) {
      this.setBoss(boss, dataSource?.bossSegments);
    }

    if (Overrides.OPP_STATUS_OVERRIDE) {
      this.status = new Status(Overrides.OPP_STATUS_OVERRIDE, 0, 4);
    }

    if (Overrides.OPP_GENDER_OVERRIDE !== null) {
      this.gender = Overrides.OPP_GENDER_OVERRIDE;
    }

    const speciesId = this.species.speciesId;

    if (
      speciesId in Overrides.OPP_FORM_OVERRIDES
      && Overrides.OPP_FORM_OVERRIDES[speciesId]
      && this.species.forms[Overrides.OPP_FORM_OVERRIDES[speciesId]]
    ) {
      this.formIndex = Overrides.OPP_FORM_OVERRIDES[speciesId] ?? 0;
    }

    if (!dataSource) {
      this.generateAndPopulateMoveset();

      if (shinyLock || Overrides.OPP_SHINY_OVERRIDE === false) {
        this.shiny = false;
      } else {
        this.trySetShiny();
      }

      if (!this.shiny && Overrides.OPP_SHINY_OVERRIDE) {
        this.shiny = true;
        this.initShinySparkle();
      }

      if (this.shiny) {
        this.variant = this.generateShinyVariant();
        if (Overrides.OPP_VARIANT_OVERRIDE !== null) {
          this.variant = Overrides.OPP_VARIANT_OVERRIDE;
        }
      }

      this.luck = (this.shiny ? this.variant + 1 : 0) + (this.fusionShiny ? this.fusionVariant + 1 : 0);

      let prevolution: Species;
      let speciesId = species.speciesId;
      while ((prevolution = pokemonPrevolutions[speciesId])) {
        const evolution = pokemonEvolutions[prevolution].find(pe => pe.speciesId === speciesId && (!pe.evoFormKey || pe.evoFormKey === this.getFormKey()));
        if (evolution?.condition?.enforceFunc) {
          evolution.condition.enforceFunc(this);
        }
        speciesId = prevolution;
      }
    }

    this.aiType = boss || this.hasTrainer() ? AiType.SMART : AiType.SMART_RANDOM;
  }

  initBattleInfo(): void {
    if (!this.battleInfo) {
      this.battleInfo = new EnemyBattleInfo();
      this.battleInfo.updateBossSegments(this);
      this.battleInfo.initInfo(this);
    } else {
      this.battleInfo.updateBossSegments(this);
    }
  }

  /**
   * Sets the pokemons boss status. If true initializes the boss segments either from the arguments
   * or through the the Scene.getEncounterBossSegments function
   *
   * @param boss if the pokemon is a boss
   * @param bossSegments amount of boss segments (health-bar segments)
   */
  setBoss(boss: boolean = true, bossSegments: number = 0): void {
    if (boss) {
      this.bossSegments = bossSegments || globalScene.getEncounterBossSegments(globalScene.currentBattle.waveIndex, this.level, this.species, true);
      this.bossSegmentIndex = this.bossSegments - 1;
    } else {
      this.bossSegments = 0;
      this.bossSegmentIndex = 0;
    }
  }

  generateAndPopulateMoveset(formIndex?: number): void {
    switch (true) {
      case (this.species.speciesId === Species.SMEARGLE):
        this.moveset = [
          new PokemonMove(Moves.SKETCH),
          new PokemonMove(Moves.SKETCH),
          new PokemonMove(Moves.SKETCH),
          new PokemonMove(Moves.SKETCH)
        ];
        break;
      case (this.species.speciesId === Species.ETERNATUS):
        this.moveset = (formIndex !== undefined ? formIndex : this.formIndex)
          ? [
            new PokemonMove(Moves.DYNAMAX_CANNON),
            new PokemonMove(Moves.CROSS_POISON),
            new PokemonMove(Moves.FLAMETHROWER),
            new PokemonMove(Moves.RECOVER, 0, -4)
          ]
          : [
            new PokemonMove(Moves.ETERNABEAM),
            new PokemonMove(Moves.SLUDGE_BOMB),
            new PokemonMove(Moves.FLAMETHROWER),
            new PokemonMove(Moves.COSMIC_POWER)
          ];
        if (globalScene.gameMode.hasChallenge(Challenges.INVERSE_BATTLE)) {
          this.moveset[2] = new PokemonMove(Moves.THUNDERBOLT);
        }
        break;
      default:
        super.generateAndPopulateMoveset();
        break;
    }
  }

  /**
   * Determines the move this Pokemon will use on the next turn, as well as
   * the Pokemon the move will target.
   * @returns this Pokemon's next move in the format {move, moveTargets}
   */
  getNextMove(): TurnMove {
    // If this Pokemon has a move already queued, return it.
    const moveQueue = this.getMoveQueue();
    if (moveQueue.length !== 0) {
      const queuedMove = moveQueue[0];
      if (queuedMove) {
        const moveIndex = this.getMoveset().findIndex(m => m?.moveId === queuedMove.move);
        if ((moveIndex > -1 && this.getMoveset()[moveIndex]!.isUsable(this, queuedMove.ignorePP)) || queuedMove.virtual) {
          return queuedMove;
        } else {
          this.getMoveQueue().shift();
          return this.getNextMove();
        }
      }
    }

    // Filter out any moves this Pokemon cannot use
    let movePool = this.getMoveset().filter(m => m?.isUsable(this));
    // If no moves are left, use Struggle. Otherwise, continue with move selection
    if (movePool.length) {
      // If there's only 1 move in the move pool, use it.
      if (movePool.length === 1) {
        return { move: movePool[0]!.moveId, targets: this.getNextTargets(movePool[0]!.moveId) }; // TODO: are the bangs correct?
      }
      // If a move is forced because of Encore, use it.
      const encoreTag = this.getTag(EncoreTag) as EncoreTag;
      if (encoreTag) {
        const encoreMove = movePool.find(m => m?.moveId === encoreTag.moveId);
        if (encoreMove) {
          return { move: encoreMove.moveId, targets: this.getNextTargets(encoreMove.moveId) };
        }
      }
      switch (this.aiType) {
        case AiType.RANDOM: // No enemy should spawn with this AI type in-game
          const moveId = movePool[globalScene.randBattleSeedInt(movePool.length)]!.moveId; // TODO: is the bang correct?
          return { move: moveId, targets: this.getNextTargets(moveId) };
        case AiType.SMART_RANDOM:
        case AiType.SMART:
        /**
         * Search this Pokemon's move pool for moves that will KO an opposing target.
         * If there are any moves that can KO an opponent (i.e. a player Pokemon),
         * those moves are the only ones considered for selection on this turn.
         */
          const koMoves = movePool.filter(pkmnMove => {
            if (!pkmnMove) {
              return false;
            }

            const move = pkmnMove.getMove()!;
            if (move.moveTarget === MoveTarget.ATTACKER) {
              return false;
            }

            const fieldPokemon = globalScene.getField();
            const moveTargets = getMoveTargets(this, move.id).targets
              .map(ind => fieldPokemon[ind])
              .filter(p => this.isPlayer() !== p.isPlayer());
            // Only considers critical hits for crit-only moves or when this Pokemon is under the effect of Laser Focus
            const isCritical = move.hasAttr(CritOnlyAttr) || !!this.getTag(BattlerTagType.ALWAYS_CRIT);

            return move.category !== MoveCategory.STATUS
            && moveTargets.some(p => {
              const doesNotFail = move.applyConditions(this, p, move) || [ Moves.SUCKER_PUNCH, Moves.UPPER_HAND, Moves.THUNDERCLAP ].includes(move.id);
              return doesNotFail && p.getAttackDamage(this, move, !p.battleData.abilityRevealed, false, isCritical).damage >= p.hp;
            });
          }, this);

          if (koMoves.length > 0) {
            movePool = koMoves;
          }

          /**
         * Move selection is based on the move's calculated "benefit score" against the
         * best possible target(s) (as determined by {@linkcode getNextTargets}).
         * For more information on how benefit scores are calculated, see `docs/enemy-ai.md`.
         */
          const moveScores = movePool.map(() => 0);
          const moveTargets = Object.fromEntries(movePool.map(m => [ m!.moveId, this.getNextTargets(m!.moveId) ])); // TODO: are those bangs correct?
          for (const m in movePool) {
            const pokemonMove = movePool[m]!; // TODO: is the bang correct?
            const move = pokemonMove.getMove();

            let moveScore = moveScores[m];
            const targetScores: number[] = [];

            for (const mt of moveTargets[move.id]) {
            // Prevent a target score from being calculated when the target is whoever attacks the user
              if (mt === BattlerIndex.ATTACKER) {
                break;
              }

              const target = globalScene.getField()[mt];
              /**
             * The "target score" of a move is given by the move's user benefit score + the move's target benefit score.
             * If the target is an ally, the target benefit score is multiplied by -1.
             */
              let targetScore = move.getUserBenefitScore(this, target, move) + move.getTargetBenefitScore(this, target, move) * (mt < BattlerIndex.ENEMY === this.isPlayer() ? 1 : -1);
              if (Number.isNaN(targetScore)) {
                console.error(`Move ${move.name} returned score of NaN`);
                targetScore = 0;
              }
              /**
             * If this move is unimplemented, or the move is known to fail when used, set its
             * target score to -20
             */
              if ((move.name.endsWith(" (N)") || !move.applyConditions(this, target, move)) && ![ Moves.SUCKER_PUNCH, Moves.UPPER_HAND, Moves.THUNDERCLAP ].includes(move.id)) {
                targetScore = -20;
              } else if (move instanceof AttackMove) {
              /**
               * Attack moves are given extra multipliers to their base benefit score based on
               * the move's type effectiveness against the target and whether the move is a STAB move.
               */
                const effectiveness = target.getMoveEffectiveness(this, move, !target.battleData?.abilityRevealed);
                if (target.isPlayer() !== this.isPlayer()) {
                  targetScore *= effectiveness;
                  if (this.isOfType(move.type)) {
                    targetScore *= 1.5;
                  }
                } else if (effectiveness) {
                  targetScore /= effectiveness;
                  if (this.isOfType(move.type)) {
                    targetScore /= 1.5;
                  }
                }
                /** If a move has a base benefit score of 0, its benefit score is assumed to be unimplemented at this point */
                if (!targetScore) {
                  targetScore = -20;
                }
              }
              targetScores.push(targetScore);
            }
            // When a move has multiple targets, its score is equal to the maximum target score across all targets
            moveScore += Math.max(...targetScores);

            // could make smarter by checking opponent def/spdef
            moveScores[m] = moveScore;
          }

          console.log(moveScores);

          // Sort the move pool in decreasing order of move score
          const sortedMovePool = movePool.slice(0);
          sortedMovePool.sort((a, b) => {
            const scoreA = moveScores[movePool.indexOf(a)];
            const scoreB = moveScores[movePool.indexOf(b)];
            return scoreA < scoreB ? 1 : scoreA > scoreB ? -1 : 0;
          });
          let r = 0;
          if (this.aiType === AiType.SMART_RANDOM) {
          // Has a 5/8 chance to select the best move, and a 3/8 chance to advance to the next best move (and repeat this roll)
            while (r < sortedMovePool.length - 1 && globalScene.randBattleSeedInt(8) >= 5) {
              r++;
            }
          } else if (this.aiType === AiType.SMART) {
          // The chance to advance to the next best move increases when the compared moves' scores are closer to each other.
            while (r < sortedMovePool.length - 1 && (moveScores[movePool.indexOf(sortedMovePool[r + 1])] / moveScores[movePool.indexOf(sortedMovePool[r])]) >= 0
              && globalScene.randBattleSeedInt(100) < Math.round((moveScores[movePool.indexOf(sortedMovePool[r + 1])] / moveScores[movePool.indexOf(sortedMovePool[r])]) * 50)) {
              r++;
            }
          }
          console.log(movePool.map(m => m!.getName()), moveScores, r, sortedMovePool.map(m => m!.getName())); // TODO: are those bangs correct?
          return { move: sortedMovePool[r]!.moveId, targets: moveTargets[sortedMovePool[r]!.moveId] };
      }
    }

    return { move: Moves.STRUGGLE, targets: this.getNextTargets(Moves.STRUGGLE) };
  }

  /**
   * Determines the Pokemon the given move would target if used by this Pokemon
   * @param moveId {@linkcode Moves} The move to be used
   * @returns The indexes of the Pokemon the given move would target
   */
  getNextTargets(moveId: Moves): BattlerIndex[] {
    const moveTargets = getMoveTargets(this, moveId);
    const targets = globalScene.getField(true).filter(p => moveTargets.targets.indexOf(p.getBattlerIndex()) > -1);
    // If the move is multi-target, return all targets' indexes
    if (moveTargets.multiple) {
      return targets.map(p => p.getBattlerIndex());
    }

    const move = allMoves[moveId];

    /**
     * Get the move's target benefit score against each potential target.
     * For allies, this score is multiplied by -1.
     */
    const benefitScores = targets
      .map(p => [ p.getBattlerIndex(), move.getTargetBenefitScore(this, p, move) * (p.isPlayer() === this.isPlayer() ? 1 : -1) ]);

    const sortedBenefitScores = benefitScores.slice(0);
    sortedBenefitScores.sort((a, b) => {
      const scoreA = a[1];
      const scoreB = b[1];
      return scoreA < scoreB ? 1 : scoreA > scoreB ? -1 : 0;
    });

    if (!sortedBenefitScores.length) {
      // Set target to BattlerIndex.ATTACKER when using a counter move
      // This is the same as when the player does so
      if (move.hasAttr(CounterDamageAttr)) {
        return [ BattlerIndex.ATTACKER ];
      }

      return [];
    }

    let targetWeights = sortedBenefitScores.map(s => s[1]);
    const lowestWeight = targetWeights[targetWeights.length - 1];

    // If the lowest target weight (i.e. benefit score) is negative, add abs(lowestWeight) to all target weights
    if (lowestWeight < 1) {
      for (let w = 0; w < targetWeights.length; w++) {
        targetWeights[w] += Math.abs(lowestWeight - 1);
      }
    }

    // Remove any targets whose weights are less than half the max of the target weights from consideration
    const benefitCutoffIndex = targetWeights.findIndex(s => s < targetWeights[0] / 2);
    if (benefitCutoffIndex > -1) {
      targetWeights = targetWeights.slice(0, benefitCutoffIndex);
    }

    const thresholds: number[] = [];
    let totalWeight: number = 0;
    targetWeights.reduce((total: number, w: number) => {
      total += w;
      thresholds.push(total);
      totalWeight = total;
      return total;
    }, 0);

    /**
     * Generate a random number from 0 to (totalWeight-1),
     * then select the first target whose cumulative weight (with all previous targets' weights)
     * is greater than that random number.
     */
    const randValue = globalScene.randBattleSeedInt(totalWeight);
    let targetIndex: number = 0;

    thresholds.every((t, i) => {
      if (randValue >= t) {
        return true;
      }

      targetIndex = i;
      return false;
    });

    return [ sortedBenefitScores[targetIndex][0] ];
  }

  isPlayer() {
    return false;
  }

  hasTrainer(): boolean {
    return !!this.trainerSlot;
  }

  isBoss(): boolean {
    return !!this.bossSegments;
  }

  getBossSegmentIndex(): number {
    const segments = (this as EnemyPokemon).bossSegments;
    const segmentSize = this.getMaxHp() / segments;
    for (let s = segments - 1; s > 0; s--) {
      const hpThreshold = Math.round(segmentSize * s);
      if (this.hp > hpThreshold) {
        return s;
      }
    }

    return 0;
  }

  damage(damage: number, ignoreSegments: boolean = false, preventEndure: boolean = false, ignoreFaintPhase: boolean = false): number {
    if (this.isFainted()) {
      return 0;
    }

    let clearedBossSegmentIndex = this.isBoss()
      ? this.bossSegmentIndex + 1
      : 0;

    if (this.isBoss() && !ignoreSegments) {
      const segmentSize = this.getMaxHp() / this.bossSegments;
      for (let s = this.bossSegmentIndex; s > 0; s--) {
        const hpThreshold = segmentSize * s;
        const roundedHpThreshold = Math.round(hpThreshold);
        if (this.hp >= roundedHpThreshold) {
          if (this.hp - damage <= roundedHpThreshold) {
            const hpRemainder = this.hp - roundedHpThreshold;
            let segmentsBypassed = 0;
            while (segmentsBypassed < this.bossSegmentIndex && this.canBypassBossSegments(segmentsBypassed + 1) && (damage - hpRemainder) >= Math.round(segmentSize * Math.pow(2, segmentsBypassed + 1))) {
              segmentsBypassed++;
              //console.log('damage', damage, 'segment', segmentsBypassed + 1, 'segment size', segmentSize, 'damage needed', Math.round(segmentSize * Math.pow(2, segmentsBypassed + 1)));
            }

            damage = Utils.toDmgValue(this.hp - hpThreshold + segmentSize * segmentsBypassed);
            clearedBossSegmentIndex = s - segmentsBypassed;
          }
          break;
        }
      }
    }

    switch (globalScene.currentBattle.battleSpec) {
      case BattleSpec.FINAL_BOSS:
        if (!this.formIndex && this.bossSegmentIndex < 1) {
          damage = Math.min(damage, this.hp - 1);
        }
    }

    const ret = super.damage(damage, ignoreSegments, preventEndure, ignoreFaintPhase);

    if (this.isBoss()) {
      if (ignoreSegments) {
        const segmentSize = this.getMaxHp() / this.bossSegments;
        clearedBossSegmentIndex = Math.ceil(this.hp / segmentSize);
      }
      if (clearedBossSegmentIndex <= this.bossSegmentIndex) {
        this.handleBossSegmentCleared(clearedBossSegmentIndex);
      }
      this.battleInfo.updateBossSegments(this);
    }

    return ret;
  }

  canBypassBossSegments(segmentCount: number = 1): boolean {
    if (globalScene.currentBattle.battleSpec === BattleSpec.FINAL_BOSS) {
      if (!this.formIndex && (this.bossSegmentIndex - segmentCount) < 1) {
        return false;
      }
    }

    return true;
  }

  /**
   * Go through a boss' health segments and give stats boosts for each newly cleared segment
   * The base boost is 1 to a random stat that's not already maxed out per broken shield
   * For Pokemon with 3 health segments or more, breaking the last shield gives +2 instead
   * For Pokemon with 5 health segments or more, breaking the last two shields give +2 each
   * @param segmentIndex index of the segment to get down to (0 = no shield left, 1 = 1 shield left, etc.)
   */
  handleBossSegmentCleared(segmentIndex: number): void {
    while (this.bossSegmentIndex > 0 && segmentIndex - 1 < this.bossSegmentIndex) {
      // Filter out already maxed out stat stages and weigh the rest based on existing stats
      const leftoverStats = EFFECTIVE_STATS.filter((s: EffectiveStat) => this.getStatStage(s) < 6);
      const statWeights = leftoverStats.map((s: EffectiveStat) => this.getStat(s, false));

      let boostedStat: EffectiveStat;
      const statThresholds: number[] = [];
      let totalWeight = 0;

      for (const i in statWeights) {
        totalWeight += statWeights[i];
        statThresholds.push(totalWeight);
      }

      // Pick a random stat from the leftover stats to increase its stages
      const randInt = Utils.randSeedInt(totalWeight);
      for (const i in statThresholds) {
        if (randInt < statThresholds[i]) {
          boostedStat = leftoverStats[i];
          break;
        }
      }

      let stages = 1;

      // increase the boost if the boss has at least 3 segments and we passed last shield
      if (this.bossSegments >= 3 && this.bossSegmentIndex === 1) {
        stages++;
      }
      // increase the boost if the boss has at least 5 segments and we passed the second to last shield
      if (this.bossSegments >= 5 && this.bossSegmentIndex === 2) {
        stages++;
      }

      globalScene.unshiftPhase(new StatStageChangePhase(this.getBattlerIndex(), true, [ boostedStat! ], stages, true, true));
      this.bossSegmentIndex--;
    }
  }

  getFieldIndex(): number {
    return globalScene.getEnemyField().indexOf(this);
  }

  getBattlerIndex(): BattlerIndex {
    return BattlerIndex.ENEMY + this.getFieldIndex();
  }

  /**
   * Add a new pokemon to the player's party (at `slotIndex` if set).
   * The new pokemon's visibility will be set to `false`.
   * @param pokeballType the type of pokeball the pokemon was caught with
   * @param slotIndex an optional index to place the pokemon in the party
   * @returns the pokemon that was added or null if the pokemon could not be added
   */
  addToParty(pokeballType: PokeballType, slotIndex: number = -1) {
    const party = globalScene.getPlayerParty();
    let ret: PlayerPokemon | null = null;

    if (party.length < PLAYER_PARTY_MAX_SIZE) {
      this.pokeball = pokeballType;
      this.metLevel = this.level;
      this.metBiome = globalScene.arena.biomeType;
      this.metWave = globalScene.currentBattle.waveIndex;
      this.metSpecies = this.species.speciesId;
      const newPokemon = globalScene.addPlayerPokemon(this.species, this.level, this.abilityIndex, this.formIndex, this.gender, this.shiny, this.variant, this.ivs, this.nature, this);

      if (Utils.isBetween(slotIndex, 0, PLAYER_PARTY_MAX_SIZE - 1)) {
        party.splice(slotIndex, 0, newPokemon);
      } else {
        party.push(newPokemon);
      }

      // Hide the Pokemon since it is not on the field
      newPokemon.setVisible(false);

      ret = newPokemon;
      globalScene.triggerPokemonFormChange(newPokemon, SpeciesFormChangeActiveTrigger, true);
    }

    return ret;
  }
}

export interface TurnMove {
  move: Moves;
  targets: BattlerIndex[];
  result?: MoveResult;
  virtual?: boolean;
  turn?: number;
  ignorePP?: boolean;
}

export interface AttackMoveResult {
  move: Moves;
  result: DamageResult;
  damage: number;
  critical: boolean;
  sourceId: number;
  sourceBattlerIndex: BattlerIndex;
}

export class PokemonSummonData {
  /** [Atk, Def, SpAtk, SpDef, Spd, Acc, Eva] */
  public statStages: number[] = [ 0, 0, 0, 0, 0, 0, 0 ];
  public moveQueue: TurnMove[] = [];
  public tags: BattlerTag[] = [];
  public abilitySuppressed: boolean = false;
  public abilitiesApplied: Abilities[] = [];
  public speciesForm: PokemonSpeciesForm | null;
  public fusionSpeciesForm: PokemonSpeciesForm;
  public ability: Abilities = Abilities.NONE;
  public passiveAbility: Abilities = Abilities.NONE;
  public gender: Gender;
  public fusionGender: Gender;
  public stats: number[] = [ 0, 0, 0, 0, 0, 0 ];
  public moveset: (PokemonMove | null)[];
  // If not initialized this value will not be populated from save data.
  public types: Type[] = [];
  public addedType: Type | null = null;
}

export class PokemonBattleData {
  /** counts the hits the pokemon received */
  public hitCount: number = 0;
  /** used for {@linkcode Moves.RAGE_FIST} in order to save hit Counts received before Rage Fist is applied */
  public prevHitCount: number = 0;
  public endured: boolean = false;
  public berriesEaten: BerryType[] = [];
  public abilitiesApplied: Abilities[] = [];
  public abilityRevealed: boolean = false;
}

export class PokemonBattleSummonData {
  /** The number of turns the pokemon has passed since entering the battle */
  public turnCount: number = 1;
  /** The number of turns the pokemon has passed since the start of the wave */
  public waveTurnCount: number = 1;
  /** The list of moves the pokemon has used since entering the battle */
  public moveHistory: TurnMove[] = [];
}

export class PokemonTurnData {
  public flinched: boolean = false;
  public acted: boolean = false;
  /** How many times the move should hit the target(s) */
  public hitCount: number = 0;
  /**
   * - `-1` = Calculate how many hits are left
   * - `0` = Move is finished
   */
  public hitsLeft: number = -1;
  public totalDamageDealt: number = 0;
  public singleHitDamageDealt: number = 0;
  public damageTaken: number = 0;
  public attacksReceived: AttackMoveResult[] = [];
  public order: number;
  public statStagesIncreased: boolean = false;
  public statStagesDecreased: boolean = false;
  public moveEffectiveness: TypeDamageMultiplier | null = null;
  public combiningPledge?: Moves;
  public switchedInThisTurn: boolean = false;
  public failedRunAway: boolean = false;
  public joinedRound: boolean = false;
  /**
   * Used to make sure multi-hits occur properly when the user is
   * forced to act again in the same turn
   */
  public extraTurns: number = 0;
}

export enum AiType {
  RANDOM,
  SMART_RANDOM,
  SMART
}

export enum MoveResult {
  PENDING,
  SUCCESS,
  FAIL,
  MISS,
  OTHER
}

export enum HitResult {
  EFFECTIVE = 1,
  SUPER_EFFECTIVE,
  NOT_VERY_EFFECTIVE,
  ONE_HIT_KO,
  NO_EFFECT,
  STATUS,
  HEAL,
  FAIL,
  MISS,
  OTHER,
  IMMUNE
}

export type DamageResult = HitResult.EFFECTIVE | HitResult.SUPER_EFFECTIVE | HitResult.NOT_VERY_EFFECTIVE | HitResult.ONE_HIT_KO | HitResult.OTHER;

/** Interface containing the results of a damage calculation for a given move */
export interface DamageCalculationResult {
  /** `true` if the move was cancelled (thus suppressing "No Effect" messages) */
  cancelled: boolean;
  /** The effectiveness of the move */
  result: HitResult;
  /** The damage dealt by the move */
  damage: number;
}

/**
 * Wrapper class for the {@linkcode Move} class for Pokemon to interact with.
 * These are the moves assigned to a {@linkcode Pokemon} object.
 * It links to {@linkcode Move} class via the move ID.
 * Compared to {@linkcode Move}, this class also tracks if a move has received.
 * PP Ups, amount of PP used, and things like that.
 * @see {@linkcode isUsable} - checks if move is restricted, out of PP, or not implemented.
 * @see {@linkcode getMove} - returns {@linkcode Move} object by looking it up via ID.
 * @see {@linkcode usePp} - removes a point of PP from the move.
 * @see {@linkcode getMovePp} - returns amount of PP a move currently has.
 * @see {@linkcode getPpRatio} - returns the current PP amount / max PP amount.
 * @see {@linkcode getName} - returns name of {@linkcode Move}.
 **/
export class PokemonMove {
  public moveId: Moves;
  public ppUsed: number;
  public ppUp: number;
  public virtual: boolean;

  /**
   * If defined and nonzero, overrides the maximum PP of the move (e.g., due to move being copied by Transform).
   * This also nullifies all effects of `ppUp`.
   */
  public maxPpOverride?: number;

  constructor(moveId: Moves, ppUsed: number = 0, ppUp: number = 0, virtual: boolean = false, maxPpOverride?: number) {
    this.moveId = moveId;
    this.ppUsed = ppUsed;
    this.ppUp = ppUp;
    this.virtual = virtual;
    this.maxPpOverride = maxPpOverride;
  }

  /**
   * Checks whether the move can be selected or performed by a Pokemon, without consideration for the move's targets.
   * The move is unusable if it is out of PP, restricted by an effect, or unimplemented.
   *
   * @param {Pokemon} pokemon {@linkcode Pokemon} that would be using this move
   * @param {boolean} ignorePp If `true`, skips the PP check
   * @param {boolean} ignoreRestrictionTags If `true`, skips the check for move restriction tags (see {@link MoveRestrictionBattlerTag})
   * @returns `true` if the move can be selected and used by the Pokemon, otherwise `false`.
   */
  isUsable(pokemon: Pokemon, ignorePp: boolean = false, ignoreRestrictionTags: boolean = false): boolean {
    if (this.moveId && !ignoreRestrictionTags && pokemon.isMoveRestricted(this.moveId, pokemon)) {
      return false;
    }

    if (this.getMove().name.endsWith(" (N)")) {
      return false;
    }

    return (ignorePp || this.ppUsed < this.getMovePp() || this.getMove().pp === -1);
  }

  getMove(): Move {
    return allMoves[this.moveId];
  }

  /**
   * Sets {@link ppUsed} for this move and ensures the value does not exceed {@link getMovePp}
   * @param {number} count Amount of PP to use
   */
  usePp(count: number = 1) {
    this.ppUsed = Math.min(this.ppUsed + count, this.getMovePp());
  }

  getMovePp(): number {
    return this.maxPpOverride || (this.getMove().pp + this.ppUp * Utils.toDmgValue(this.getMove().pp / 5));
  }

  getPpRatio(): number {
    return 1 - (this.ppUsed / this.getMovePp());
  }

  getName(): string {
    return this.getMove().name;
  }

  /**
  * Copies an existing move or creates a valid PokemonMove object from json representing one
  * @param {PokemonMove | any} source The data for the move to copy
  * @return {PokemonMove} A valid pokemonmove object
  */
  static loadMove(source: PokemonMove | any): PokemonMove {
    return new PokemonMove(source.moveId, source.ppUsed, source.ppUp, source.virtual, source.maxPpOverride);
  }
}
