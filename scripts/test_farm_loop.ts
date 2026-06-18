interface SimPlant {
    id: number;
    seedCost: number;
    expReward: number;
    requireLevel: number;
}

interface SimOrder {
    requirePlantId: number;
    requireCount: number;
    rewardStone: number;
}

interface SimUser {
    spiritStone: number;
    exp: number;
    level: number;
    bag: Record<number, number>;
}

const plants: SimPlant[] = [
    { id: 101, seedCost: 50, expReward: 10, requireLevel: 1 },
    { id: 102, seedCost: 120, expReward: 30, requireLevel: 2 },
    { id: 103, seedCost: 300, expReward: 80, requireLevel: 3 },
];

const order: SimOrder = {
    requirePlantId: 101,
    requireCount: 3,
    rewardStone: 200,
};

const user: SimUser = {
    spiritStone: 0,
    exp: 0,
    level: 1,
    bag: {},
};

function hasAnyBagItem(): boolean {
    return Object.values(user.bag).some(count => count > 0);
}

function grantSubsidyIfSoftlocked(): boolean {
    if (user.spiritStone >= 50 || hasAnyBagItem()) return false;
    user.spiritStone += 500;
    return true;
}

function tryLevelUp(): void {
    if (user.exp >= 50) user.level = Math.max(user.level, 2);
    if (user.exp >= 150) user.level = Math.max(user.level, 3);
}

function plantAndHarvest(plant: SimPlant): void {
    if (user.level < plant.requireLevel) throw new Error("realm locked");
    if (user.spiritStone < plant.seedCost) throw new Error("not enough stone");
    user.spiritStone -= plant.seedCost;
    user.bag[plant.id] = (user.bag[plant.id] || 0) + 1;
    user.exp += plant.expReward;
    tryLevelUp();
}

function submitOrder(): void {
    const have = user.bag[order.requirePlantId] || 0;
    if (have < order.requireCount) throw new Error("order locked");
    user.bag[order.requirePlantId] = have - order.requireCount;
    user.spiritStone += order.rewardStone;
}

if (!grantSubsidyIfSoftlocked()) throw new Error("subsidy did not trigger");
for (let i = 0; i < 5; i++) plantAndHarvest(plants[0]);
if (user.level < 2) throw new Error("level 2 did not unlock");
plantAndHarvest(plants[1]);
submitOrder();
if (user.spiritStone <= 0) throw new Error("economy loop failed");
console.log("farm loop ok", user);
