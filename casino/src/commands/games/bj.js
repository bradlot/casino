const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const EconomyManager = require('../../managers/EconomyManager');
const GameManager = require('../../managers/GameManager');
const StatsManager = require('../../managers/StatsManager');
const XPManager = require('../../managers/XPManager');
const AchievementManager = require('../../managers/AchievementManager');
const config = require('../../../config.js');

const SUITS = ['♠️', '♥️', '♦️', '♣️'];
const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

function generateDeck() {
    let deck = [];
    for (const suit of SUITS) {
        for (const value of VALUES) {
            deck.push({ suit, value });
        }
    }
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

function calculateHand(hand) {
    let value = 0;
    let aces = 0;
    for (const card of hand) {
        if (['J', 'Q', 'K'].includes(card.value)) {
            value += 10;
        } else if (card.value === 'A') {
            aces += 1;
            value += 11;
        } else {
            value += parseInt(card.value);
        }
    }
    while (value > 21 && aces > 0) {
        value -= 10;
        aces -= 1;
    }
    return value;
}

function formatHand(hand) {
    const spellOut = {
        'J': 'Jack',
        'Q': 'Queen',
        'K': 'King',
        'A': 'Ace'
    };
    return hand.map(card => `${spellOut[card.value] || card.value} ${card.suit}`).join('\n');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bj')
        .setDescription('Play a game of blackjack.')
        .addIntegerOption(option =>
            option.setName('bet')
                .setDescription('Amount to bet')
                .setRequired(true)),
    async execute(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guildId;

        if (GameManager.hasActiveGame(guildId, userId)) {
            return interaction.reply({ content: 'You are already in an active game!', ephemeral: true });
        }

        const betAmount = interaction.options.getInteger('bet');
        if (betAmount <= 0) {
            return interaction.reply({ content: 'Please specify a valid bet amount greater than 0.', ephemeral: true });
        }

        const user = EconomyManager.getUser(guildId, userId);
        if (user.balance < betAmount) {
            return interaction.reply({ content: `You don't have enough money in your wallet! Wallet: $${user.balance.toLocaleString()}.`, ephemeral: true });
        }

        // Lock game state and take money from WALLET ONLY
        GameManager.startGame(guildId, userId, 'blackjack');
        EconomyManager.removeWallet(guildId, userId, betAmount);
        EconomyManager.updateStats(guildId, userId, betAmount, 0);

        // Phase 7: Give Play XP
        XPManager.addXp(guildId, userId, config.xpSystem.rewards.bj_play);

        let deck = generateDeck();
        let playerHand = [deck.pop(), deck.pop()];
        let dealerHand = [deck.pop(), deck.pop()];

        let playerValue = calculateHand(playerHand);
        let dealerShowValue = calculateHand([dealerHand[0]]);

        const buildEmbed = (status, final = false, resultMsg = '', payout = 0, levelMsg = '') => {
            let color = config.themeColor;
            if (status === 'WIN') color = config.successColor;
            if (status === 'LOSE') color = config.errorColor;
            if (status === 'PUSH') color = 0xFFFF00;

            const embed = new EmbedBuilder()
                .setTitle(`${config.casinoEmoji} Blackjack | Bet: $${betAmount.toLocaleString()}`)
                .setColor(color)
                .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() });

            if (final) {
                const finalDealerValue = calculateHand(dealerHand);
                embed.addFields(
                    { name: `Your Hand`, value: formatHand(playerHand), inline: true },
                    { name: `Dealer's Hand`, value: formatHand(dealerHand), inline: true },
                    { name: '\u200b', value: '\u200b', inline: true }, // Spacer
                    { name: `Your Total`, value: `**${playerValue}**`, inline: true },
                    { name: `Dealer's Total`, value: `**${finalDealerValue}**`, inline: true },
                    { name: '\u200b', value: '\u200b', inline: true }  // Spacer
                );
                embed.setDescription(`**${status}** | ${resultMsg}${levelMsg}`);
                if (payout > 0) {
                    embed.setFooter({ text: config.footerBranding ? `${config.footerBranding} | Profit: +$${(payout - betAmount).toLocaleString()}` : `Profit: +$${(payout - betAmount).toLocaleString()}` });
                } else if (status === 'PUSH') {
                    embed.setFooter({ text: config.footerBranding ? `${config.footerBranding} | Bet returned: +$${betAmount.toLocaleString()}` : `Bet returned: +$${betAmount.toLocaleString()}` });
                } else {
                    embed.setFooter({ text: config.footerBranding ? `${config.footerBranding} | Lost: -$${betAmount.toLocaleString()}` : `Lost: -$${betAmount.toLocaleString()}` });
                }
            } else {
                const spellOut = {
                    'J': 'Jack',
                    'Q': 'Queen',
                    'K': 'King',
                    'A': 'Ace'
                };
                embed.addFields(
                    { name: `Your Hand`, value: formatHand(playerHand), inline: true },
                    { name: `Dealer's Hand`, value: `${spellOut[dealerHand[0].value] || dealerHand[0].value} ${dealerHand[0].suit}`, inline: true },
                    { name: '\u200b', value: '\u200b', inline: true }, // Spacer
                    { name: `Your Total`, value: `**${playerValue}**`, inline: true },
                    { name: `Dealer's Total`, value: `**${dealerShowValue} + ?**`, inline: true },
                    { name: '\u200b', value: '\u200b', inline: true }  // Spacer
                );
            }
            return embed;
        };

        const getRow = (disable = false) => {
            return new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('hit').setLabel('Hit').setStyle(ButtonStyle.Success).setDisabled(disable),
                new ButtonBuilder().setCustomId('stand').setLabel('Stand').setStyle(ButtonStyle.Danger).setDisabled(disable),
                new ButtonBuilder().setCustomId('double').setLabel('Double').setStyle(ButtonStyle.Primary).setDisabled(disable || playerHand.length > 2 || user.balance < betAmount * 2)
            );
        };

        // Natural Blackjack Check
        if (playerValue === 21) {
            const dealerBlackjack = calculateHand(dealerHand) === 21;
            GameManager.endGame(guildId, userId);

            if (dealerBlackjack) {
                EconomyManager.addWallet(guildId, userId, betAmount);
                StatsManager.addPush(guildId, userId, 'bj');
                const embed = buildEmbed('PUSH', true, 'Both you and the dealer hit a natural Blackjack!');
                AchievementManager.checkAll(guildId, userId, interaction);
                return interaction.reply({ embeds: [embed] });
            } else {
                const payout = Math.floor(betAmount * config.games.blackjack.naturalBlackjackMultiplier);
                EconomyManager.addWallet(guildId, userId, payout);
                EconomyManager.updateStats(guildId, userId, 0, payout - betAmount);
                StatsManager.addWin(guildId, userId, 'bj', payout - betAmount);

                let lvlMsg = '';
                const leveledUp = XPManager.addXp(guildId, userId, config.xpSystem.rewards.bj_win);
                if (leveledUp) lvlMsg = `\n**🆙 You leveled up!**`;

                const embed = buildEmbed('WIN', true, 'Natural Blackjack!', payout, lvlMsg);
                AchievementManager.checkAll(guildId, userId, interaction);
                return interaction.reply({ embeds: [embed] });
            }
        }

        let gameMessage;
        try {
            gameMessage = await interaction.reply({
                embeds: [buildEmbed('IN_PROGRESS')],
                components: [getRow()],
                fetchReply: true
            });
        } catch (error) {
            GameManager.endGame(guildId, userId);
            EconomyManager.addWallet(guildId, userId, betAmount);
            throw error;
        }

        const collector = gameMessage.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 60000,
            filter: i => i.user.id === userId
        });

        let currentBet = betAmount;

        const endRound = async (i, finalPlayerValue, doubled = false) => {
            collector.stop('ended');
            GameManager.endGame(guildId, userId);

            let lvlMsg = '';

            if (finalPlayerValue > 21) {
                StatsManager.addLoss(guildId, userId, 'bj', currentBet);
                await i.update({ embeds: [buildEmbed('LOSE', true, 'You busted!')], components: [getRow(true)] });
                AchievementManager.checkAll(guildId, userId, interaction);
                return;
            }

            let finalDealerValue = calculateHand(dealerHand);
            while (finalDealerValue < 17) {
                dealerHand.push(deck.pop());
                finalDealerValue = calculateHand(dealerHand);
            }

            // Phase 7: Edge Reduction
            // Technically a blackjack house edge manipulation alters dealer rules invisibly.
            // As an example, if heavily perked, dealer might bust automatically on a soft 17 instead of hitting/standing perfectly
            const edgeReduction = XPManager.getPerkModifier(guildId, userId, 'bjHouseEdgeReductionPerLevel');
            if (edgeReduction > 0 && Math.random() < edgeReduction) {
                // Secretly force dealer to bust because of high level edge reduction!
                if (finalDealerValue <= 21 && finalDealerValue > finalPlayerValue) {
                    dealerHand.push({ suit: '♥️', value: '10' }); // Rigged card to bust
                    finalDealerValue = calculateHand(dealerHand);
                    lvlMsg = `\n*✨ Level Perk: The dealer magically "slipped" and busted!*`;
                }
            }

            if (finalDealerValue > 21) {
                const payout = Math.floor(currentBet * config.games.blackjack.payoutMultiplier);
                EconomyManager.addWallet(guildId, userId, payout);
                EconomyManager.updateStats(guildId, userId, 0, payout - currentBet);
                StatsManager.addWin(guildId, userId, 'bj', payout - currentBet);

                const leveledUp = XPManager.addXp(guildId, userId, config.xpSystem.rewards.bj_win);
                if (leveledUp) lvlMsg += `\n**🆙 You leveled up!**`;

                await i.update({ embeds: [buildEmbed('WIN', true, 'Dealer busted!', payout, lvlMsg)], components: [getRow(true)] });
            } else if (finalDealerValue === finalPlayerValue) {
                EconomyManager.addWallet(guildId, userId, currentBet);
                StatsManager.addPush(guildId, userId, 'bj');
                await i.update({ embeds: [buildEmbed('PUSH', true, 'It\'s a tie!', 0, lvlMsg)], components: [getRow(true)] });
            } else if (finalPlayerValue > finalDealerValue) {
                const payout = Math.floor(currentBet * config.games.blackjack.payoutMultiplier);
                EconomyManager.addWallet(guildId, userId, payout);
                EconomyManager.updateStats(guildId, userId, 0, payout - currentBet);
                StatsManager.addWin(guildId, userId, 'bj', payout - currentBet);

                const leveledUp = XPManager.addXp(guildId, userId, config.xpSystem.rewards.bj_win);
                if (leveledUp) lvlMsg += `\n**🆙 You leveled up!**`;

                await i.update({ embeds: [buildEmbed('WIN', true, 'You beat the dealer!', payout, lvlMsg)], components: [getRow(true)] });
            } else {
                StatsManager.addLoss(guildId, userId, 'bj', currentBet);
                await i.update({ embeds: [buildEmbed('LOSE', true, 'Dealer wins!', 0, lvlMsg)], components: [getRow(true)] });

                // Pity bankruptcy check
                const u = EconomyManager.getUser(guildId, userId);
                if (u.balance === 0) {
                    if (!AchievementManager.getUnlocked(guildId, userId).includes('lose_everything')) {
                        const ach = config.achievements.find(a => a.id === 'lose_everything');
                        AchievementManager.unlock(guildId, userId, ach, interaction);
                    }
                }
            }

            AchievementManager.checkAll(guildId, userId, interaction);
        };

        collector.on('collect', async i => {
            collector.resetTimer();

            if (i.customId === 'hit') {
                playerHand.push(deck.pop());
                playerValue = calculateHand(playerHand);

                if (playerValue >= 21) {
                    await endRound(i, playerValue);
                } else {
                    await i.update({ embeds: [buildEmbed('IN_PROGRESS')], components: [getRow()] });
                }
            } else if (i.customId === 'stand') {
                await endRound(i, playerValue);
            } else if (i.customId === 'double') {
                EconomyManager.removeWallet(guildId, userId, betAmount);
                EconomyManager.updateStats(guildId, userId, betAmount, 0);
                currentBet *= 2;

                playerHand.push(deck.pop());
                playerValue = calculateHand(playerHand);

                await endRound(i, playerValue, true);
            }
        });

        collector.on('end', (collected, reason) => {
            if (reason === 'time') {
                GameManager.endGame(guildId, userId);
                StatsManager.addLoss(guildId, userId, 'bj', currentBet);
                interaction.editReply({
                    embeds: [buildEmbed('LOSE', true, 'Game timed out. You folded and lost your bet.')],
                    components: [getRow(true)]
                }).catch(() => { });
                AchievementManager.checkAll(guildId, userId, interaction);
            }
        });
    }
};
