'use client';

import {
  Box,
  Button,
  Container,
  ExternalLink,
  Flex,
  Grid,
  Heading,
  Paragraph,
  Section,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Stack,
  Text,
} from '@plyaz/ui';
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ContactUsFormSchema, type ContactUsForm } from '@plyaz/errors';
import { useTranslation } from '@plyaz/translations/frontend';

export const UIPreviews = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
    reset,
  } = useForm<ContactUsForm>({
    resolver: zodResolver(ContactUsFormSchema),
    mode: 'onBlur',
    defaultValues: { name: '', email: '' },
  });
  const { t } = useTranslation();
  const onSubmit = async () => {
    const value = 600;
    await new Promise(r => setTimeout(r, value));
    reset();
  };
  return (
    <Box className='bg-white min-h-screen text-gray-900'>
      {/* Navigation */}
      <Box element='header' className='bg-black py-4 border-b h-16 text-white'>
        <Box element='nav' className='px-6'>
          <Flex justify='between' align='center'>
            <Heading
              element='h1'
              size='xs'
              className={`
                tracking-wide text-white
                md:text-xl
              `}
            >
              {t('component.UIComponent')}
            </Heading>
            <Flex align='center' gap='3' className='md:gap-3'>
              {['Portfolio', 'Dashboard', 'Blog'].map(item => (
                <ExternalLink key={item} href={`#`}>
                  <Text
                    element='p'
                    size='sm'
                    weight='medium'
                    variant='body'
                    className={`
                      cursor-pointer transition-colors duration-200
                      hover:text-gray-300
                      md:text-lg
                    `}
                  >
                    {item}
                  </Text>
                </ExternalLink>
              ))}
              <button
                className={`
                  hidden rounded-lg bg-secondary px-4 py-2 text-white
                  transition-colors duration-200
                  hover:bg-accent cursor-pointer
                  md:block
                `}
              >
                Get Started
              </button>
            </Flex>
          </Flex>
        </Box>
      </Box>
      <Select>
        <SelectTrigger className='w-[180px]'>
          <SelectValue placeholder='Theme' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='light'>Light</SelectItem>
          <SelectItem value='dark'>Dark</SelectItem>
          <SelectItem value='system'>System</SelectItem>
        </SelectContent>
      </Select>

      {/* Hero Section */}

      <Section
        className={`
          py-10
          md:py-20
        `}
      >
        <Container>
          <Stack
            className={`
              items-center gap-2
              lg:flex-row
            `}
            direction='vertical'
          >
            <Heading
              element='h1'
              size='xl'
              className={`
                text-center font-bold tracking-tight
                lg:text-3xl
              `}
            >
              Build Beautiful UIs with Reusable Components
            </Heading>
            <Paragraph
              size='lg'
              color='muted'
              className={`
              mx-auto max-w-3xl text-center
            `}
            >
              A React + TypeScript-based component library with flexible, composable building blocks
              that scale with your product.
            </Paragraph>
            <Flex gap='2' justify='center' wrap='wrap'>
              <button
                className={`
                  w-44 rounded-lg bg-secondary px-6 py-3 text-white transition
                  hover:bg-accent cursor-pointer
                `}
              >
                Get Started
              </button>
              <ExternalLink href='https://github.com'>
                <button
                  className={`
                    w-44 rounded-lg border border-gray-300 px-6 py-3 transition
                    hover:bg-gray-100
                  `}
                >
                  View on GitHub
                </button>
              </ExternalLink>
            </Flex>
          </Stack>
        </Container>
      </Section>
      <Box className='bg-white/80 shadow-xl backdrop-blur mx-auto p-6 border border-gray-100 rounded-2xl max-w-lg'>
        <Heading element='h2' size='3xl' className='mb-1 font-semibold text-2xl'>
          Contact Us
        </Heading>
        <Paragraph size='lg' className='mb-6 text-gray-500 text-sm'>
          Leave your name and email — we’ll get back to you shortly.
        </Paragraph>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className='space-y-8'>
          {/* Name */}
          <Box>
            <label htmlFor='name' className='block mb-1 font-medium text-gray-700 text-sm'>
              Name
            </label>
            <input
              id='name'
              {...register('name')}
              placeholder='Your full name'
              className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-shadow
              ${errors.name ? 'border-red-400' : 'border-gray-200'}`}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
            {/* Always cast dynamic keys to Parameters<typeof t>[0] so TypeScript accepts them */}
            {errors.name && (
              <Paragraph
                size='lg'
                id='name-error'
                role='alert'
                className='mt-1 text-red-600 text-sm'
              >
                {t(`${errors.name.message}` as Parameters<typeof t>[0])}
              </Paragraph>
            )}
          </Box>

          {/* Email */}
          {/* Always cast dynamic keys to Parameters<typeof t>[0] so TypeScript accepts them */}
          <Box>
            <label htmlFor='email' className='block mb-1 font-medium text-gray-700 text-sm'>
              Email
            </label>
            <input
              id='email'
              type='email'
              {...register('email')}
              placeholder='you@example.com'
              className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-shadow
              ${errors.email ? 'border-red-400' : 'border-gray-200'}`}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <Paragraph
                size='lg'
                id='email-error'
                role='alert'
                className='mt-1 text-red-600 text-sm'
              >
                {t(`${errors.email.message}` as Parameters<typeof t>[0])}
              </Paragraph>
            )}
          </Box>

          {/* Actions */}
          <Box className='flex justify-between items-center gap-4'>
            <Button
              type='submit'
              disabled={isSubmitting}
              className='inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 px-5 py-2 rounded-lg font-medium text-white transition cursor-pointer'
            >
              {isSubmitting ? 'Sending…' : 'Send Message'}
            </Button>

            <Button
              type='button'
              onClick={() => reset()}
              className='text-gray-600 text-sm hover:underline cursor-pointer'
            >
              Reset
            </Button>
          </Box>

          {isSubmitSuccessful && (
            <Box className='mt-3 text-green-700 text-sm'>Thanks — your message was sent!</Box>
          )}
        </form>
      </Box>
      {/* Features Section */}
      <Section
        className={`
          bg-gray-50 py-10
          md:py-20
        `}
      >
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

            <Grid
              gap='2'
              className={`
              grid-cols-1
              md:grid-cols-2
              lg:grid-cols-4
            `}
            >
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
          <Grid
            gap='2'
            className={`
            grid-cols-1
            md:grid-cols-3
          `}
          >
            {[
              { number: '10+', label: 'Components', desc: 'Ready to use' },
              { number: '100%', label: 'TypeScript', desc: 'Type coverage' },
              { number: '∞', label: 'Possibilities', desc: 'Creative freedom' },
            ].map((stat, index) => (
              <Box key={index} className='text-center'>
                <Heading
                  element='h3'
                  size='4xl'
                  className={`
                  mb-2 font-bold text-blue-600
                `}
                >
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
      <Section
        className={`
          py-10
          md:py-20
        `}
      >
        <Container>
          <Grid
            className={`
            grid-cols-1
            lg:grid-cols-2
          `}
            justify='center'
            align='center'
            gap='2'
          >
            <Stack className='items-center' direction='vertical'>
              <Heading element='h2' size='xl' className='font-semibold'>
                Simple. Powerful. Flexible.
              </Heading>
              <Paragraph
                size='sm'
                className={`
                  text-justify
                  md:text-base
                `}
              >
                Every component is powered by our base <code>Box</code> component, giving you full
                control with consistent props and clean design.
              </Paragraph>
            </Stack>
            <Stack
              className={`
                flex-wrap
                lg:flex-nowrap
              `}
            >
              <Text
                element='p'
                size='sm'
                weight='medium'
                variant='body'
                className={`
                  text-center text-gray-800
                  md:text-base
                `}
              >
                ✓ Consistent API design
              </Text>
              <Text
                element='p'
                size='sm'
                weight='medium'
                variant='body'
                className={`
                  text-center text-gray-800
                  md:text-base
                `}
              >
                ✓ Semantic HTML structure
              </Text>
              <Text
                element='p'
                size='sm'
                weight='medium'
                variant='body'
                className={`
                  text-center text-gray-800
                  md:text-base
                `}
              >
                ✓ Tailwind utilities under the hood
              </Text>
            </Stack>
          </Grid>
        </Container>
      </Section>

      {/* CTA */}
      <Box element='footer' className='bg-blue-600 px-6 py-4 text-white'>
        <Stack
          spacing='gap-2'
          className={`
            flex-col items-center justify-between
            md:flex-row
          `}
        >
          <Heading element='h2' size='xl' className='font-bold text-center'>
            Ready to Get Started?
          </Heading>
          <Flex gap='2' justify='center' align='center' direction='col' className={`md:flex-row`}>
            <Paragraph
              size='xs'
              className={`
                max-w-xl text-center
                lg:text-sm
              `}
            >
              Join thousands of developers building with the @plyaz/ui library. It&apos;s time to
              bring consistency, speed, and elegance to your app.
            </Paragraph>
            <button
              className={`
                rounded-lg bg-white px-6 py-3 font-semibold text-blue-600
                transition
                hover:bg-gray-100
              `}
            >
              Start Building
            </button>
          </Flex>
        </Stack>
      </Box>
    </Box>
  );
};
