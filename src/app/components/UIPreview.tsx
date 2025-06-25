'use client';
import {
  Box,
  Container,
  ExternalLink,
  Flex,
  Grid,
  Heading,
  Paragraph,
  Section,
  Stack,
  Text,
} from '@plyaz/ui';
import React from 'react';

const UI_PREVIEW = () => {
  return (
    <Box element='main' className='min-h-screen bg-white text-gray-900'>
      {/* Navigation */}
      <Box element='header' className='border-b bg-black py-4 text-white'>
        <Box element='nav' className='px-6'>
          <Flex justify='between' align='center'>
            <Heading element='h1' size='xl' className='tracking-wide text-white'>
              UI Components
            </Heading>
            <Flex align='center' gap='gap-3'>
              {['Portfolio', 'Dashboard', 'Blog'].map(item => (
                <ExternalLink key={item} href={`#`}>
                  <Text
                    element='p'
                    size='lg'
                    weight='medium'
                    variant='body'
                    className={
                      `
                        cursor-pointer transition-colors duration-200
                        hover:text-gray-300
                      `
                    }
                  >
                    {item}
                  </Text>
                </ExternalLink>
              ))}
              <button
                className={
                  `
                    rounded-lg bg-blue-600 px-4 py-2 text-white
                    transition-colors duration-200
                    hover:bg-blue-700
                  `
                }
              >
                Get Started
              </button>
            </Flex>
          </Flex>
        </Box>
      </Box>

      {/* Hero Section */}
      <Section className='py-20'>
        <Container>
          <Stack className='items-center'>
            <Heading element='h1' size='4xl' className={`
              text-center font-bold tracking-tight
            `}>
              Build Beautiful UIs with Reusable Components
            </Heading>
            <Paragraph size='lg' color='muted' className={`
              mx-auto max-w-3xl text-center
            `}>
              A React + TypeScript-based component library with flexible, composable building blocks
              that scale with your product.
            </Paragraph>
            <Flex gap='gap-2' justify='center' wrap='wrap'>
              <button className={`
                w-44 rounded-lg bg-blue-600 px-6 py-3 text-white transition
                hover:bg-blue-700
              `}>
                Get Started
              </button>
              <ExternalLink href='https://github.com'>
                <button className={`
                  w-44 rounded-lg border border-gray-300 px-6 py-3 transition
                  hover:bg-gray-100
                `}>
                  View on GitHub
                </button>
              </ExternalLink>
            </Flex>
          </Stack>
        </Container>
      </Section>

      {/* Features Section */}
      <Section className='bg-gray-50 py-16'>
        <Container>
          <Stack direction='vertical' spacing='gap-4'>
            <Box className='text-center'>
              <Heading element='h2' size='3xl' className='mb-2 font-semibold'>
                Why Choose Our Components?
              </Heading>
              <Paragraph size='lg' color='muted'>
                Flexibility, performance, and great DX built-in
              </Paragraph>
            </Box>

            <Grid cols='grid-cols-1 md:grid-cols-2 lg:grid-cols-4' gap='gap-2'>
              {[
                { title: 'Lightning Fast', desc: 'Optimized with tiny bundles and zero bloat.' },
                { title: 'Type Safe', desc: '100% TypeScript with full IntelliSense support.' },
                { title: 'Accessible', desc: 'Built with best practices for accessibility.' },
                { title: 'Flexible', desc: 'Composable and themable component structure.' },
              ].map((feature, i) => (
                <Box
                  key={i}
                  className={`
                    rounded-lg bg-white p-6 shadow-md transition-transform
                    duration-300
                    hover:-translate-y-1 hover:shadow-lg
                  `}
                >
                  <Heading element='h3' size='xl' className='mb-2 font-semibold'>
                    {feature.title}
                  </Heading>
                  <Paragraph size='base' color='muted'>
                    {feature.desc}
                  </Paragraph>
                </Box>
              ))}
            </Grid>
          </Stack>
        </Container>
      </Section>

      {/* Stats */}
      <Section className='py-12'>
        <Container>
          <Grid cols='grid-cols-1 md:grid-cols-3' gap='2rem'>
            {[
              { number: '10+', label: 'Components', desc: 'Ready to use' },
              { number: '100%', label: 'TypeScript', desc: 'Type coverage' },
              { number: '∞', label: 'Possibilities', desc: 'Creative freedom' },
            ].map((stat, index) => (
              <Box key={index} className='text-center'>
                <Heading element='h3' size='4xl' className={`
                  mb-2 font-bold text-blue-600
                `}>
                  {stat.number}
                </Heading>
                <Text element='p' size='lg' weight='semibold' variant='body'>
                  {stat.label}
                </Text>
                <Paragraph size='base' color='muted'>
                  {stat.desc}
                </Paragraph>
              </Box>
            ))}
          </Grid>
        </Container>
      </Section>

      {/* Code Preview / Feature Callout */}
      <Section className='py-16'>
        <Container>
          <Grid cols='grid-cols-1 lg:grid-cols-2' justify='center' align='center' gap='gap-4'>
            <Stack className='items-center'>
              <Heading element='h2' size='xl' className='font-semibold'>
                Simple. Powerful. Flexible.
              </Heading>
              <Paragraph size='base'>
                Every component is powered by our base <code>Box</code> component, giving you full
                control with consistent props and clean design.
              </Paragraph>
            </Stack>
            <Stack>
              <Text
                element='p'
                size='base'
                weight='medium'
                variant='body'
                className='text-center text-gray-800'
              >
                ✓ Consistent API design
              </Text>
              <Text
                element='p'
                size='base'
                weight='medium'
                variant='body'
                className='text-center text-gray-800'
              >
                ✓ Semantic HTML structure
              </Text>
              <Text
                element='p'
                size='base'
                weight='medium'
                variant='body'
                className='text-center text-gray-800'
              >
                ✓ Tailwind utilities under the hood
              </Text>
            </Stack>
          </Grid>
        </Container>
      </Section>

      {/* CTA */}
      <Box element='footer' className='bg-blue-600 px-6 py-4 text-white'>
        <Stack spacing='gap-2' className='items-center justify-between'>
          <Heading element='h2' size='3xl' className='text-center font-bold'>
            Ready to Get Started?
          </Heading>
          <Flex gap='gap-2' justify='center' align='center'>
            <Paragraph size='lg' className='max-w-xl text-center'>
              Join thousands of developers building with the @plyaz/ui library. It&apos;s time to
              bring consistency, speed, and elegance to your app.
            </Paragraph>
            <button className={`
              rounded-lg bg-white px-6 py-3 font-semibold text-blue-600
              transition
              hover:bg-gray-100
            `}>
              Start Building
            </button>
          </Flex>
        </Stack>
      </Box>
    </Box>
  );
};

export default UI_PREVIEW;
