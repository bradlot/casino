module.exports = {
    // ----------------------------------------------------
    // GENERAL BOT SETTINGS
    // ----------------------------------------------------
    prefix: '=',
    casinoChannels: [''], // For games (blackjack, etc). Set to empty array [] to allow globally
    botChannels: [''], // For economy/shop (work, bal, payday). Set to empty array [] to allow globally
    adminChannels: [''], // For admin commands (addmoney, etc). Set to empty array [] to allow globally

    // Aesthetics
    themeColor: 0xFFD700, // Hex color for most embeds
    errorColor: 0xFF0000,
    successColor: 0x00FF00,
    casinoEmoji: '🎰', // Emoji added to titles
    footerBranding: '',

    // ----------------------------------------------------
    // LEVELING & XP SYSTEM (Phase 7)
    // ----------------------------------------------------
    xpSystem: {
        baseRequirement: 100, // XP needed for Level 2
        scalingFactor: 1.5, // Exponent math: xpNeeded = baseRequirement * (currentLevel ^ scalingFactor)

        // XP gained for each action
        rewards: {
            work: { min: 10, max: 20 },
            crime: { min: 30, max: 50 },
            rob_success: { min: 20, max: 40 },
            bj_play: 5,
            bj_win: 15
        },

        // Stat advantages gained per level (Base Levels)
        perks: {
            crimeReductionPerLevel: 0.01, // 1% reduction in fine per level
            workMultiplierPerLevel: 0.02, // 2% more work payout per level
            robCapIncreasePerLevel: 0.005, // 0.5% more rob capacity per level
            bjHouseEdgeReductionPerLevel: 0.001 // Secret logic altering blackjack odds
        }
    },

    // ----------------------------------------------------
    // ECONOMY SYSTEM SETTINGS
    // ----------------------------------------------------
    admin: {
        maxPurgeCount: 1000000
    },

    economy: {
        // Daily Payday
        payday: {
            amount: 5000,
            cooldownHours: 24,
        },

        // Work Command
        work: {
            minPayout: 100,
            maxPayout: 800,
            cooldownHours: 2,
            scenarios: [
                "You washed dishes at the casino restaurant.",
                "You drove a high-roller to the airport.",
                "You found some loose change under the blackjack table.",
                "You sold some 'questionable' brownies at a local bake sale.",
                "You worked as a bouncer at a shady underground club.",
                "You helped clean up a crime scene for the drug cartel.",
                "You smuggled exotic animals across the border.",
                "You stood on a street corner holding a sign for a dispensary.",
                "You were hired as a private investigator to track down a cheating spouse.",
                "You tested some new, slightly radioactive energy drinks for a shady corporation.",
                "You drove an unmarked van full of suspicious packages across state lines.",
                "You got paid to distract the police while a drug deal went down.",
                "You collected debts for a local loan shark.",
                "You worked the midnight shift at the local strip club.",
                "You starred in a highly questionable adult film.",
                "You sold feet pics to lonely people on the internet.",
                "You worked as an escort for a filthy rich politician.",
                "You cleaned the sticky booths at the peep show downtown.",
                "You sold your used bathwater for an absurd amount of money.",
                "You performed a private lap dance for a mafia boss."
            ]
        },

        // Crime Command
        crime: {
            baseSuccessChance: 0.25, // 25% chance of success
            minPayout: 5000,
            maxPayout: 20000,
            cooldownHours: 0.5,
            successScenarios: [
                "You successfully hacked an ATM.",
                "You successfully cooked a massive batch of Walter White's finest.",
                "You sold a trunk full of illegal firearms to a local gang.",
                "You hijacked a semi-truck carrying a lifetime supply of electronics.",
                "You successfully counterfeited a million dollars in your basement.",
                "You smuggled a shipment of pure Colombian bam-bam past customs.",
                "You kidnapped a billionaire's dog and collected the ransom.",
                "You rigged a high-stakes underground poker game.",
                "You sold some highly questionable goods on the dark web.",
                "You breached a government database and sold the secrets to a foreign spy.",
                "You ran a successful crypto rug pull and vanished with the funds.",
                "You robbed a bank wearing a clown mask and got away.",
                "You blackmailed a celebrity with their leaked sex tape.",
                "You successfully assassinated a cartel rival and collected the bounty.",
                "You snuck pure fentanyl into the prison and made a killing.",
                "You ran a wildly successful illegal underground brothel.",
                "You harvested and sold some black market kidneys to the highest bidder."
            ],
            failScenarios: [
                "The DEA kicked your door down mid-cook.",
                "An undercover cop busted your deal.",
                "You dropped your wallet while running from the police and they found your ID.",
                "The tourist you tried to scam was actually an undercover FBI agent.",
                "The counterfeit money you printed had George Washington winking.",
                "Your getaway driver stopped for a drive-thru burger and got arrested.",
                "You accidentally tried to rob a mafia boss's house.",
                "The border patrol dogs smelled the stash immediately.",
                "You got tased by a granny during a mugging attempt.",
                "The cartel found out you were skimming from their drops.",
                "You shot yourself in the foot during an armed robbery.",
                "The SWAT team breached the windows while you were counting the cash.",
                "You caught a nasty STD at the illegal brothel you were managing.",
                "The politician you tried to blackmail had you waterboarded by mercenaries.",
                "You got stabbed by a crackhead over a $10 bag.",
                "The hooker you tried to rob was actually an undercover vice cop.",
                "You took a bullet to the groin during a botched drive-by shooting."
            ]
        },

        // Rob Command
        rob: {
            baseSuccessChance: 0.15, // 15% chance to rob successfully
            baseStealCap: 0.25, // Can steal up to 25% of target's wallet by default
            minStealPercent: 0.05, // Will steal at least 5% minimum
            cooldownHours: 0.5,
            failScenarios: [
                "They fought back and threw you in a dumpster.",
                "A police cruiser happened to drive by as you tried to rob them.",
                "You completely missed and robbed a mailbox instead.",
                "They pulled out a Glock instead of their wallet.",
                "You realized you were trying to rob an undercover cop.",
                "They saw you coming and sprinted away.",
                "You tripped on a crack pipe while sneaking up on them.",
                "Instead of robbing them, you accidentally handed them your own wallet.",
                "They unleashed their rabid pitbull on you.",
                "They pulled out a taser and shocked you until you pissed yourself.",
                "They were high on meth and beat you to a pulp with a toaster.",
                "They flashed a cartel tattoo, and you ran for your life.",
                "You tried to pull a knife, but they pulled out a machete.",
                "They turned out to be a professional dominatrix and made you their little bitch.",
                "They pepper-sprayed you directly in the urethra.",
                "They strapped you to a chair and slowly broke your fingers.",
                "They pulled out a massive shotgun and blew off your left buttock.",
                "You realized you were robbing a psycho and ended up tied up in their sex dungeon."
            ]
        }
    },

    // ----------------------------------------------------
    // CASINO GAMES SETTINGS
    // ----------------------------------------------------
    games: {
        blackjack: {
            payoutMultiplier: 2.0, // Standard win
            naturalBlackjackMultiplier: 2.5, // 3:2 payout meaning a 100 bet pays back 250 (profit 150)
            dealerSoft17Hit: true // True = Dealer hits on Soft 17. False = Dealer stands on Soft 17
        }
    },

    // ----------------------------------------------------
    // SHOP & BUFFS SETTINGS (Phase 10)
    // ----------------------------------------------------
    shop: {
        categories: [
            {
                id: "roles",
                name: "Custom Roles",
                description: "Exclusive discord roles",
                items: [
                    {
                        id: "vip",
                        name: "VIP",
                        description: "Exclusive VIP role with special name color",
                        price: 10000,
                        roleId: "987654321098765432"
                    },
                    {
                        id: "stripper",
                        name: "Stripper",
                        description: "Working the midnight shift for those tips.",
                        price: 15000,
                        roleId: "111111111111111111"
                    },
                    {
                        id: "simp",
                        name: "Simp",
                        description: "You've donated your entire life savings to a streamer who doesn't know you exist.",
                        price: 20000,
                        roleId: "101010101010101010"
                    },
                    {
                        id: "degenerate",
                        name: "Degenerate",
                        description: "For the players who physically cannot stop gambling.",
                        price: 25000,
                        roleId: "222222222222222222"
                    },
                    {
                        id: "crackhead",
                        name: "Crackhead",
                        description: "Will do literally anything for 20 bucks.",
                        price: 30000,
                        roleId: "123123123123123123"
                    },
                    {
                        id: "pimp",
                        name: "Pimp",
                        description: "Pimpin' ain't easy, but it sure is fun.",
                        price: 40000,
                        roleId: "202020202020202020"
                    },
                    {
                        id: "whale",
                        name: "Whale",
                        description: "The ultimate high roller role",
                        price: 50000,
                        roleId: "333333333333333333"
                    },
                    {
                        id: "escort",
                        name: "Escort",
                        description: "Your companionship absolutely does not come cheap.",
                        price: 50000,
                        roleId: "444444444444444444"
                    },
                    {
                        id: "of_model",
                        name: "Top 0.1% Creator",
                        description: "Making absolute bank selling bathwater on the internet.",
                        price: 75000,
                        roleId: "555555555555555555"
                    },
                    {
                        id: "sugardaddy",
                        name: "Sugar Daddy",
                        description: "You fund everyone else's terrible habits.",
                        price: 100000,
                        roleId: "666666666666666666"
                    },
                    {
                        id: "sugarmommy",
                        name: "Sugar Mommy",
                        description: "Spoiling your favorite little degenerates.",
                        price: 100000,
                        roleId: "666666666666666667"
                    },
                    {
                        id: "pornstar",
                        name: "Pornstar",
                        description: "A certified legend in the adult entertainment industry.",
                        price: 150000,
                        roleId: "777777777777777777"
                    },
                    {
                        id: "cultleader",
                        name: "Cult Leader",
                        description: "You have a compound in the woods and too many wives.",
                        price: 200000,
                        roleId: "456456456456456456"
                    },
                    {
                        id: "dictator",
                        name: "Dictator",
                        description: "Absolute power corrupts absolutely.",
                        price: 1000000,
                        roleId: "999999999999999999"
                    },
                    {
                        id: "illuminati",
                        name: "Illuminati",
                        description: "You control the very fabric of reality from the shadows.",
                        price: 2500000,
                        roleId: "404040404040404040"
                    }
                ]
            },
            {
                id: "boosts",
                name: "Economy Boosts",
                description: "Temporary buffs to increase your earnings",
                items: [
                    {
                        id: "workboost",
                        name: "Energy Drink",
                        description: "Doubles the payout of /work for 1 hour.",
                        price: 2000,
                        buffType: "buff_work_expires",
                        durationHours: 1,
                        stackableLimit: 24, // Won't stack past 24 hours of duration
                        effectAmount: 2.0 // 2x multiplier
                    },
                    {
                        id: "crimeboost",
                        name: "Hacker Tool USB",
                        description: "Increases crime success chance by +20% for 3 hours.",
                        price: 8000,
                        buffType: "buff_crime_expires",
                        durationHours: 3,
                        stackableLimit: 12,
                        effectAmount: 0.20 // +0.20 chance to success
                    }
                ]
            },
            {
                id: "protection",
                name: "Security & Protection",
                description: "Items to defend your hard-earned wallet",
                items: [
                    {
                        id: "padlock",
                        name: "Wallet Padlock",
                        description: "Reduces the amount robbers can steal from you by half for 24 hours.",
                        price: 5000,
                        buffType: "buff_rob_protect_expires",
                        durationHours: 24,
                        stackableLimit: 72,
                        effectAmount: 0.50 // Cuts robbed amount in half
                    }
                ]
            }
        ]
    },

    // ----------------------------------------------------
    // ACHIEVEMENTS SYSTEM (Phase 12)
    // ----------------------------------------------------
    achievements: [
        {
            id: "first_win",
            name: "Beginner's Luck",
            description: "Win your very first game of Blackjack.",
            reward: 1000,
            isHidden: false,
            conditionKey: "bj_wins",
            targetAmount: 1
        },
        {
            id: "crime_ten",
            name: "Career Criminal",
            description: "Successfully pull off 10 crimes.",
            reward: 50000,
            isHidden: false,
            conditionKey: "crime_successes",
            targetAmount: 10
        },
        {
            id: "rob_master",
            name: "Pickpocket Master",
            description: "Successfully rob other players 20 times.",
            reward: 100000,
            isHidden: false,
            conditionKey: "rob_successes",
            targetAmount: 20
        },
        {
            id: "lose_everything",
            name: "Rock Bottom",
            description: "Lose a massive bet or get caught by police and drop to $0.",
            reward: 100, // Pity coin
            isHidden: true,
            conditionKey: "bankrupt_events", // Trigger manually inside code
            targetAmount: 1
        },
        {
            id: "millionaire",
            name: "Millionaire's Club",
            description: "Reach $1,000,000 Total Earned.",
            reward: 250000,
            isHidden: false,
            conditionKey: "total_earned",
            targetAmount: 1000000
        },
        {
            id: "workaholic",
            name: "Corporate Wage Slave",
            description: "Work a miserable shift 50 times. You must hate yourself.",
            reward: 20000,
            isHidden: false,
            conditionKey: "work_count",
            targetAmount: 50
        }
    ],

    // ----------------------------------------------------
    // LIVE EVENTS SYSTEM (Phase 16)
    // ----------------------------------------------------
    eventDurationLimits: {
        h: 23,   // Max hours
        d: 29,   // Max days
        mo: 6    // Max months
    },

    // Event Templates for /event command
    events: [
        {
            id: "double_payday",
            name: "Double Payday Weekend",
            multiplier: 2.0
        },
        {
            id: "stimulus",
            name: "Economy Stimulus",
            multiplier: 5.0
        },
        {
            id: "crime_wave",
            name: "City Crime Wave",
            multiplier: 3.0 // We could use this in crime commands later
        }
    ]
};
