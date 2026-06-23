import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Text,
} from '@chakra-ui/react';
import { PageHeader, GlassCard } from '../components/ui';

const FAQS: { q: string; a: string }[] = [
  {
    q: 'What is ctez?',
    a: 'ctez is a tez derivative backed entirely by tez. It lets smart contracts pool tez together without the thorny question of "who bakes", since ctez itself is delegation-neutral. It targets a value that drifts over time to reflect the accrual of baking rewards.',
  },
  {
    q: 'What is an oven?',
    a: 'An oven is a smart contract controlled by a single user. You place tez in it, pick any baker you like, and mint ctez against that collateral. Each oven tracks your tez balance and your outstanding ctez debt.',
  },
  {
    q: 'What are the target and drift?',
    a: 'The target is the number of tez a ctez should be pegged to — it starts at 1.0 and grows over time. The drift is a system-wide rate that adjusts the target up or down based on how the CFMM market price compares to the target, nudging ctez back toward its peg.',
  },
  {
    q: 'When does an oven get liquidated?',
    a: 'If an oven holds less tez collateral than its outstanding ctez × target × 16/15 (a ~6.67% safety buffer), anyone can liquidate it — sending ctez to burn the debt and claiming a portion of the collateral. Keep your collateral ratio comfortably above this threshold.',
  },
  {
    q: 'How does trading work?',
    a: 'A constant-product market maker (CFMM, like Uniswap) lets anyone swap tez for ctez and back. Once per block it pushes the implied rate to the ctez contract, which adjusts the drift and target. You can also provide liquidity to the pool and earn the 0.05% swap fee.',
  },
  {
    q: 'Is this portal custodial?',
    a: 'No. Everything happens directly between your wallet and the ctez contracts on Tezos mainnet. This portal never holds your keys or your funds — it only builds transactions for you to sign.',
  },
];

export default function Faq() {
  return (
    <Box>
      <PageHeader title="FAQ" subtitle="How ctez, ovens, and the CFMM work." />
      <GlassCard p={{ base: 2, md: 4 }}>
        <Accordion allowMultiple defaultIndex={[0]}>
          {FAQS.map((f) => (
            <AccordionItem key={f.q} border="none" borderBottom="1px solid rgba(255,255,255,0.06)">
              <AccordionButton py={4} _hover={{ bg: 'whiteAlpha.50' }} borderRadius="lg">
                <Box flex={1} textAlign="left" fontWeight={700}>
                  {f.q}
                </Box>
                <AccordionIcon />
              </AccordionButton>
              <AccordionPanel pb={5} color="whiteAlpha.700" fontSize="sm" lineHeight={1.7}>
                {f.a}
              </AccordionPanel>
            </AccordionItem>
          ))}
        </Accordion>
      </GlassCard>
    </Box>
  );
}
