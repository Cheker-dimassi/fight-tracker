import { AppFighter, OctagonFighter } from './octagon-api';

export function transformToOctagonFighter(fighter: AppFighter): OctagonFighter {
  return {
    id: fighter.id,
    name: fighter.name,
    nickname: fighter.nickname || '',
    weight_class: fighter.weightClass,
    wins: fighter.record.wins,
    losses: fighter.record.losses,
    draws: fighter.record.draws,
    nationality: fighter.nationality,
    age: fighter.age,
    height: fighter.height,
    reach: fighter.reach,
    stance: fighter.stance,
    rank: fighter.rank ? parseInt(fighter.rank.replace('#', '')) : undefined,
    image_url: fighter.imageUrl
  };
}
