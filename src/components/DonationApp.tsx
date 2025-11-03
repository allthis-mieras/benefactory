import { useCallback, useEffect, useMemo, useState } from 'react';
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip as RechartsTooltip,
	XAxis,
	YAxis,
} from 'recharts';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

type DonationFrequency = 'monthly' | 'quarterly' | 'yearly';

type Donation = {
	id: string;
	charity_name: string;
	amount: number;
	frequency: DonationFrequency;
	annual_amount: number;
	created_at: string;
};

type Message = { type: 'success' | 'error' | 'info'; text: string } | null;

type HouseholdPayload = {
	household: {
		id: string;
		annual_income: number;
		alias: string | null;
	};
	donations: Donation[];
};

const COOKIE_KEY = 'mindthegap_household';
const SHARE_PARAM = 'd';
const LINE_COLORS = ['#ee352e', '#fccc0a', '#00933c', '#ff6319', '#0039a6'];

const BAR_COLORS = LINE_COLORS;
const PIE_COLORS = ['#ee352e', '#00933c', '#ff6319', '#b933ad', '#0039a6'];
const MESSAGE_STYLES: Record<'success' | 'error' | 'info', string> = {
  success: 'border border-emerald-600 bg-emerald-50 text-emerald-900',
  error: 'border border-red-600 bg-red-50 text-red-900',
  info: 'border border-sky-600 bg-sky-50 text-sky-900',
};

const numberFormatter = new Intl.NumberFormat('nl-NL');
const currencyFormatter = new Intl.NumberFormat('nl-NL', {
	style: 'currency',
	currency: 'EUR',
	maximumFractionDigits: 0,
});
const percentFormatter = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 });

const BILLIONAIRES = [
  {
    name: 'Elon Musk',
    netWorth: 226_000_000_000,
  },
  {
    name: 'Jeff Bezos',
    netWorth: 205_000_000_000,
  },
  {
    name: 'Bernard Arnault',
    netWorth: 195_000_000_000,
  },
];

const sanitizeNumericInput = (value: string) => value.replace(/[^\d]/g, '');
const formatNumericInput = (value: string) => {
	const digits = sanitizeNumericInput(value);
	if (!digits) return '';
	return numberFormatter.format(Number(digits));
};
const parseNumericInput = (value: string) => {
	const digits = sanitizeNumericInput(value);
	return digits ? Number(digits) : 0;
};

const computeAnnualAmount = (amount: number, frequency: DonationFrequency) => {
	switch (frequency) {
		case 'monthly':
			return amount * 12;
		case 'quarterly':
			return amount * 4;
		default:
			return amount;
	}
};

const readCookie = (name: string) => {
	if (typeof document === 'undefined') return null;
	const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
	return match ? decodeURIComponent(match[1]) : null;
};

const writeCookie = (name: string, value: string, days = 30) => {
	if (typeof document === 'undefined') return;
	const expires = new Date(Date.now() + days * 864e5).toUTCString();
	document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
};

export default function DonationApp() {
	const [householdId, setHouseholdId] = useState<string | null>(null);
	const [annualIncome, setAnnualIncome] = useState<number>(0);
	const [incomeInput, setIncomeInput] = useState<string>('');
	const [donations, setDonations] = useState<Donation[]>([]);
	const [chartView, setChartView] = useState<'income' | 'donations'>('income');
	const [isSheetOpen, setIsSheetOpen] = useState(false);
	const [shareLink, setShareLink] = useState<string | null>(null);
	const [message, setMessage] = useState<Message>(null);
	const [loading, setLoading] = useState(true);
	const [editingDonation, setEditingDonation] = useState<Donation | null>(null);
	const defaultDonationForm = { charity: '', amount: '', frequency: 'monthly' as DonationFrequency };
	const [formState, setFormState] = useState(defaultDonationForm);
	const isEditing = Boolean(editingDonation);
	const sheetTitle = isEditing ? 'Edit charity' : 'Add charity';
	const submitLabel = isEditing ? 'Update' : 'Save';

	const resetForm = () => {
		setFormState({ ...defaultDonationForm });
		setEditingDonation(null);
	};

	const openNewDonation = () => {
		resetForm();
		setIsSheetOpen(true);
	};

	const openEditDonation = (donation: Donation) => {
		setEditingDonation(donation);
		setFormState({
			charity: donation.charity_name,
			amount: numberFormatter.format(donation.amount),
			frequency: donation.frequency,
		});
		setIsSheetOpen(true);
	};

	const applyPayload = useCallback((payload: HouseholdPayload) => {
		if (payload.household) {
			setHouseholdId(payload.household.id);
			setAnnualIncome(payload.household.annual_income ?? 0);
			setIncomeInput(
				payload.household.annual_income ? numberFormatter.format(payload.household.annual_income) : '',
			);
		}
		setDonations(payload.donations ?? []);
	}, []);

	useEffect(() => {
		const initialise = async () => {
			try {
				const currentUrl = new URL(window.location.href);
				const sharedId = currentUrl.searchParams.get(SHARE_PARAM);

				if (sharedId) {
					const response = await fetch(`/api/household?id=${sharedId}`);
					if (response.ok) {
						const payload = (await response.json()) as HouseholdPayload;
						applyPayload(payload);
						writeCookie(COOKIE_KEY, payload.household.id);
					} else {
						setMessage({ type: 'error', text: 'Could not load that shared snapshot.' });
					}
					currentUrl.searchParams.delete(SHARE_PARAM);
					window.history.replaceState(null, '', currentUrl.toString());
					setLoading(false);
					return;
				}

				const cookieId = readCookie(COOKIE_KEY);
				if (cookieId) {
					const response = await fetch(`/api/household?id=${cookieId}`);
					if (response.ok) {
						const payload = (await response.json()) as HouseholdPayload;
						applyPayload(payload);
						setLoading(false);
						return;
					}
				}

				const response = await fetch('/api/household', {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({ annualIncome: 0 }),
				});
				if (response.ok) {
					const payload = (await response.json()) as HouseholdPayload;
					applyPayload(payload);
					writeCookie(COOKIE_KEY, payload.household.id);
				} else {
					setMessage({ type: 'error', text: 'Starting a fresh session failed. Try again shortly.' });
				}
			} catch (error) {
				console.error(error);
				setMessage({ type: 'error', text: 'Something went sideways while talking to the server.' });
			} finally {
				setLoading(false);
			}
		};

		initialise();
	}, [applyPayload]);

	useEffect(() => {
		if (!message) return;
		const timeout = setTimeout(() => setMessage(null), 3200);
		return () => clearTimeout(timeout);
	}, [message]);

	const totals = useMemo(() => {
		const totalAnnualDonations = donations.reduce((sum, donation) => sum + donation.annual_amount, 0);
		const percentage = annualIncome > 0 ? (totalAnnualDonations / annualIncome) * 100 : 0;
		return { totalAnnualDonations, percentage };
	}, [annualIncome, donations]);

	const donationsWithShare = useMemo(() => {
		const total = totals.totalAnnualDonations;
		return donations.map((donation) => ({
			...donation,
			share: total > 0 ? (donation.annual_amount / total) * 100 : 0,
		}));
	}, [donations, totals.totalAnnualDonations]);

	const comparisonData = useMemo(() => {
		if (totals.percentage <= 0) {
			return [];
		}

		return BILLIONAIRES.map((person, index) => ({
			name: person.name,
			contribution: (person.netWorth * totals.percentage) / 100,
			color: BAR_COLORS[index % BAR_COLORS.length],
		}));
	}, [totals]);

	const incomePieData = useMemo(() => {
		const donated = totals.totalAnnualDonations;
		const remaining = Math.max(annualIncome - donated, 0);
		return [
			{ name: 'Donations', value: donated, color: PIE_COLORS[0] },
			{ name: 'Remaining income', value: remaining, color: PIE_COLORS[1] },
		];
	}, [annualIncome, totals.totalAnnualDonations]);

	const donationPieData = useMemo(() => {
		return donationsWithShare.map((donation, index) => ({
			name: donation.charity_name,
			value: donation.annual_amount,
			percentage: donation.share,
			color: PIE_COLORS[index % PIE_COLORS.length],
		}));
	}, [donationsWithShare]);

	const metrics = useMemo(() => {
		const percentageDisplay = totals.percentage ? `${totals.percentage.toFixed(1)}%` : '0%';
		return [
			{ label: 'Annual income', value: currencyFormatter.format(annualIncome || 0) },
			{ label: 'Yearly donations', value: currencyFormatter.format(totals.totalAnnualDonations || 0) },
			{ label: 'Share of income', value: percentageDisplay },
		];
	}, [annualIncome, totals.totalAnnualDonations, totals.percentage]);

	const handleIncomeSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!householdId) return;

		const parsed = parseNumericInput(incomeInput);
		setAnnualIncome(parsed);
		setIncomeInput(parsed ? numberFormatter.format(parsed) : '');

		const response = await fetch('/api/household', {
			method: 'PUT',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ id: householdId, annualIncome: parsed }),
		});
		if (!response.ok) {
			setMessage({ type: 'error', text: 'Updating your income fizzled.' });
			return;
		}
		const payload = (await response.json()) as HouseholdPayload;
		applyPayload(payload);
		setMessage({ type: 'success', text: 'Income saved.' });
	};

	const handleDonationSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!householdId) return;

		const amount = parseNumericInput(formState.amount);
		if (!formState.charity.trim() || amount <= 0) {
			setMessage({ type: 'error', text: 'Add a charity name and a positive amount.' });
			return;
		}

		const payload = {
			charityName: formState.charity.trim(),
			amount,
			frequency: formState.frequency,
		};

		if (editingDonation) {
			const response = await fetch('/api/donations', {
				method: 'PUT',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					id: editingDonation.id,
					householdId,
					...payload,
				}),
			});

			if (!response.ok) {
				setMessage({ type: 'error', text: 'Could not update that donation.' });
				return;
			}

			const { donations: fresh } = (await response.json()) as { donations: Donation[] };
			setDonations(fresh ?? []);
			setMessage({ type: 'success', text: 'Donation updated.' });
		} else {
			const response = await fetch('/api/donations', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ householdId, ...payload }),
			});

			if (!response.ok) {
				setMessage({ type: 'error', text: 'Could not store that donation.' });
				return;
			}

			const { donations: fresh } = (await response.json()) as { donations: Donation[] };
			setDonations(fresh ?? []);
			setMessage({ type: 'success', text: 'Donation added.' });
		}

		resetForm();
		setIsSheetOpen(false);
	};

	const handleRemoveDonation = async (id: string) => {
		if (!householdId) return;

		const response = await fetch('/api/donations', {
			method: 'DELETE',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ id, householdId }),
		});

		if (!response.ok) {
			setMessage({ type: 'error', text: 'Could not remove that donation.' });
			return;
		}

		setDonations((current) => current.filter((donation) => donation.id !== id));
		setMessage({ type: 'info', text: 'Donation removed.' });
	};

	const handleShare = () => {
		if (!householdId) {
			setMessage({ type: 'error', text: 'Add your own numbers before sharing them.' });
		 return;
		}
		const url = new URL(window.location.href);
		url.searchParams.set(SHARE_PARAM, householdId);
		const link = url.toString();
		setShareLink(link);
		if (navigator.clipboard?.writeText) {
			navigator.clipboard.writeText(link).catch(() => {
				/* noop */
			});
		}
		setMessage({ type: 'success', text: 'Shareable link copied to your clipboard.' });
	};

	const twitterShareUrl = useMemo(() => {
		if (!householdId) return '#';
		const url = new URL(window.location.href);
		url.searchParams.set(SHARE_PARAM, householdId);
		const text = encodeURIComponent(
			`Hey @JeffBezos, I give ${percentFormatter.format(totals.percentage / 100)} of my income to charity. That would be ${currencyFormatter.format(
				((BILLIONAIRES[1]?.netWorth ?? 0) * totals.percentage) / 1200,
			)} a month for you. #MindTheGap`,
		);
		return `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url.toString())}`;
	}, [householdId, totals.percentage]);

	if (loading) {
		return (
			<Card className="border-dashed">
				<CardHeader>
					<CardTitle>Loading your dashboard</CardTitle>
					<CardDescription>Hold tight — we’re lining up the numbers.</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-4">
					<Skeleton className="h-12 w-full rounded-lg" />
					<Skeleton className="h-48 w-full rounded-lg" />
				</CardContent>
			</Card>
		);
	}

	return (
		<Sheet
			open={isSheetOpen}
			onOpenChange={(open) => {
				setIsSheetOpen(open);
				if (!open) {
					resetForm();
				}
			}}
		>
			<div className="flex flex-col gap-10">
				{message ? (
					<div
						className={cn(
							'px-4 py-3 text-xs font-semibold uppercase tracking-[0.28em]',
							MESSAGE_STYLES[message.type],
						)}
					>
						{message.text}
					</div>
				) : null}
				<section className="grid gap-px border border-foreground/60 bg-muted md:grid-cols-12">
					<div className="bg-card p-6 md:col-span-5">
						<Badge variant="outline" className="tracking-[0.3em] uppercase text-muted-foreground">
							Step 1
						</Badge>
						<h2 className="mt-4 text-3xl font-black uppercase tracking-tight text-foreground">Annual income</h2>
						<p className="mt-3 text-sm leading-relaxed text-muted-foreground">
							Enter your yearly income. Every percentage and comparison reacts in real time.
						</p>
						<form className="mt-6 flex flex-col gap-4" onSubmit={handleIncomeSubmit}>
							<div className="grid gap-2">
								<Label htmlFor="income">Annual income (EUR)</Label>
								<Input
									id="income"
									inputMode="numeric"
									pattern="[0-9.]*"
									value={incomeInput}
									onChange={(event) => setIncomeInput(formatNumericInput(event.target.value))}
									placeholder="e.g. 42.000"
								/>
							</div>
							<Button type="submit" className="w-fit tracking-[0.22em] uppercase">
								Save income
							</Button>
						</form>
					</div>
					<div className="bg-card p-6 md:col-span-7 md:border-l md:border-foreground/60">
						<Badge variant="outline" className="tracking-[0.3em] uppercase text-muted-foreground">
							Overview
						</Badge>
						<div className="mt-5 grid gap-px border border-foreground/60 bg-muted sm:grid-cols-3">
							{metrics.map((metric, index) => (
								<div key={metric.label} className="bg-card p-5">
									<div className="flex items-center gap-4">
										<span
											className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
											style={{ backgroundColor: LINE_COLORS[index % LINE_COLORS.length] }}
										>
											{index + 1}
										</span>
										<div className="space-y-1">
											<p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
												{metric.label}
											</p>
											<p className="text-2xl font-black tracking-tight text-foreground">{metric.value}</p>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				</section>

				<section className="border border-foreground/60">
					<header className="flex flex-col gap-4 border-b border-foreground/60 bg-secondary px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
						<div className="space-y-2">
							<Badge variant="outline" className="tracking-[0.3em] uppercase text-muted-foreground">
								Step 2
							</Badge>
							<h2 className="text-3xl font-black uppercase tracking-tight text-foreground">Your charities</h2>
							<p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
								Add every charity you support. Tweak the cards whenever the amount or cadence shifts.
							</p>
						</div>
						<Button onClick={openNewDonation} className="tracking-[0.25em] uppercase">
							Add charity
						</Button>
					</header>
					{donationsWithShare.length === 0 ? (
						<div className="px-6 py-12 text-sm text-muted-foreground">
							No donations yet. Start with your first charity to unlock the dashboard.
						</div>
					) : (
						<div className="grid gap-px border-t border-foreground/60 bg-muted">
							{donationsWithShare.map((donation, index) => (
								<div key={donation.id} className="bg-card p-6">
									<div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
										<div className="flex items-center gap-4">
											<span
												className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
												style={{ backgroundColor: LINE_COLORS[index % LINE_COLORS.length] }}
											>
												{index + 1}
											</span>
											<div>
												<h3 className="text-xl font-semibold text-foreground">{donation.charity_name}</h3>
												<p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
													{donation.frequency === 'monthly'
														? 'Monthly'
														: donation.frequency === 'quarterly'
															? 'Quarterly'
															: 'Yearly'}
												</p>
											</div>
										</div>
										<div className="flex gap-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
											<button
												className="text-primary transition-colors hover:text-primary/80"
												onClick={() => openEditDonation(donation)}
											>
												Edit
											</button>
											<button
												className="text-destructive transition-colors hover:text-destructive/80"
												onClick={() => handleRemoveDonation(donation.id)}
											>
												Remove
											</button>
										</div>
									</div>
									<div className="mt-6 grid gap-4 text-sm uppercase tracking-[0.2em] text-muted-foreground sm:grid-cols-3">
										<div className="space-y-1">
											<p className="text-xs">Per period</p>
											<p className="text-xl font-semibold text-foreground">
												{currencyFormatter.format(donation.amount)}
											</p>
										</div>
										<div className="space-y-1">
											<p className="text-xs">Per year</p>
											<p className="text-xl font-semibold text-foreground">
												{currencyFormatter.format(donation.annual_amount)}
											</p>
										</div>
										<div className="space-y-1">
											<p className="text-xs">Share of giving</p>
											<p className="text-xl font-semibold text-foreground">
												{percentFormatter.format((donation.share || 0) / 100)}
											</p>
										</div>
									</div>
									<div className="mt-4 h-2 bg-muted">
										<div
											className="h-full"
											style={{
												width: `${Math.min(donation.share || 0, 100)}%`,
												backgroundColor: LINE_COLORS[index % LINE_COLORS.length],
											}}
										/>
									</div>
								</div>
							))}
						</div>
					)}
				</section>

				<section className="grid gap-6 lg:grid-cols-2">
					<div className="border border-foreground/60">
						<div className="border-b border-foreground/60 bg-secondary px-6 py-6">
							<Badge variant="outline" className="tracking-[0.3em] uppercase text-muted-foreground">
								Visuals
							</Badge>
							<h2 className="mt-2 text-3xl font-black uppercase tracking-tight text-foreground">Chart view</h2>
							<p className="mt-3 text-sm leading-relaxed text-muted-foreground">
								Toggle between your income picture and how your charities stack up.
							</p>
						</div>
						<div className="px-6 pb-8 pt-6">
							<Tabs value={chartView} onValueChange={(value) => setChartView(value as typeof chartView)}>
								<TabsList className="grid grid-cols-2 rounded-none border border-foreground/60 bg-card">
									<TabsTrigger value="income" className="text-xs uppercase tracking-[0.22em]">
										Income vs donations
									</TabsTrigger>
									<TabsTrigger value="donations" className="text-xs uppercase tracking-[0.22em]">
										Charity split
									</TabsTrigger>
								</TabsList>
								<TabsContent value="income" className="mt-6">
									{annualIncome === 0 ? (
										<p className="text-sm text-muted-foreground">
											Add your income to see this view.
										</p>
									) : (
										<div className="h-72 w-full">
											<ResponsiveContainer>
												<PieChart>
													<Pie data={incomePieData} dataKey="value" innerRadius={60} outerRadius={110}>
														{incomePieData.map((entry) => (
															<Cell key={entry.name} fill={entry.color} />
														))}
													</Pie>
													<RechartsTooltip
														formatter={(value: number, name: string) => [
															currencyFormatter.format(value as number),
															name,
														]}
													/>
												</PieChart>
											</ResponsiveContainer>
										</div>
									)}
								</TabsContent>
								<TabsContent value="donations" className="mt-6">
									{donationsWithShare.length === 0 ? (
										<p className="text-sm text-muted-foreground">
											Add at least one donation to unlock this chart.
										</p>
									) : (
										<div className="h-72 w-full">
											<ResponsiveContainer>
												<PieChart>
													<Pie data={donationPieData} dataKey="value" innerRadius={50} outerRadius={110}>
														{donationPieData.map((entry) => (
															<Cell key={entry.name} fill={entry.color} />
														))}
													</Pie>
													<RechartsTooltip
														formatter={(value: number, name: string, entry) => [
															`${currencyFormatter.format(value as number)} (${percentFormatter.format((entry?.payload?.percentage || 0) / 100)})`,
															name,
														]}
													/>
												</PieChart>
											</ResponsiveContainer>
										</div>
									)}
								</TabsContent>
							</Tabs>
						</div>
					</div>

					<div className="border border-foreground/60">
						<div className="border-b border-foreground/60 bg-secondary px-6 py-6">
							<Badge variant="outline" className="tracking-[0.3em] uppercase text-muted-foreground">
								Comparison
							</Badge>
							<h2 className="mt-2 text-3xl font-black uppercase tracking-tight text-foreground">Billionaire scenario</h2>
							<p className="mt-3 text-sm leading-relaxed text-muted-foreground">
								What would your percentage mean if the richest names kept pace?
							</p>
						</div>
						<div className="space-y-6 px-6 pb-8 pt-6">
							{comparisonData.length === 0 ? (
								<div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
									Add your income and donations to see the scale jump.
								</div>
							) : (
								<>
									<div className="overflow-x-auto">
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>Name</TableHead>
													<TableHead className="text-right">Per year</TableHead>
													<TableHead className="text-right">Per month</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{comparisonData.map((entry, index) => (
													<TableRow key={`${entry.name}-${index}`}>
														<TableCell className="font-medium">{entry.name}</TableCell>
														<TableCell className="text-right">
															{currencyFormatter.format(entry.contribution)}
														</TableCell>
														<TableCell className="text-right">
															{currencyFormatter.format(entry.contribution / 12)}
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</div>
									<div className="h-[320px] w-full">
										<ResponsiveContainer>
											<BarChart data={comparisonData}>
												<CartesianGrid stroke="var(--border)" strokeDasharray="0" vertical={false} />
												<XAxis dataKey="name" stroke="var(--muted-foreground)" />
												<YAxis
													stroke="var(--muted-foreground)"
													tickFormatter={(value) => `${Math.round((value as number) / 1_000_000)}M`}
												/>
												<RechartsTooltip
													cursor={{ fill: 'var(--muted)' }}
													formatter={(value: number, name: string) => [
														currencyFormatter.format(value as number),
														name,
													]}
												/>
												<Bar dataKey="contribution">
													{comparisonData.map((entry, index) => (
														<Cell
															key={`${entry.name}-${index}`}
															fill={entry.color || BAR_COLORS[index % BAR_COLORS.length]}
														/>
													))}
												</Bar>
											</BarChart>
										</ResponsiveContainer>
									</div>
								</>
							)}
						</div>
					</div>
				</section>

				<section className="border border-foreground/60 bg-card">
					<div className="border-b border-foreground/60 bg-secondary px-6 py-6">
						<Badge variant="outline" className="tracking-[0.3em] uppercase text-muted-foreground">
							Share
						</Badge>
						<h2 className="mt-2 text-3xl font-black uppercase tracking-tight text-foreground">Save & share</h2>
						<p className="mt-3 text-sm leading-relaxed text-muted-foreground">
							Create a unique link for yourself or pass the percentage on to someone else.
						</p>
					</div>
					<div className="flex flex-col gap-6 px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
						<div className="flex flex-col gap-4">
							<Button
								type="button"
								variant="outline"
								className="w-fit tracking-[0.25em] uppercase"
								onClick={handleShare}
							>
								Copy shareable link
							</Button>
							{shareLink ? (
								<div className="flex flex-col gap-2">
									<Label htmlFor="share-link">Your link</Label>
									<Input
										id="share-link"
										readOnly
										value={shareLink}
										onFocus={(event) => event.currentTarget.select()}
									/>
								</div>
							) : null}
						</div>
						<div className="max-w-sm space-y-2 text-xs text-muted-foreground">
							<a
								href={twitterShareUrl}
								target="_blank"
								rel="noreferrer"
								className="inline-flex items-center gap-2 text-primary hover:underline"
							>
								<span className="tracking-[0.28em] uppercase">Share on X</span>
							</a>
							<p>We keep your data locally via a single cookie so you can pick up later.</p>
						</div>
					</div>
				</section>
			</div>

			<SheetContent side="right" className="w-full border-l border-foreground/60 bg-card sm:max-w-xl">
				<SheetHeader className="border-b border-foreground/60 px-6 pb-4 pt-6">
					<SheetTitle className="text-2xl font-black uppercase tracking-[0.28em]">{sheetTitle}</SheetTitle>
					<SheetDescription className="text-sm leading-relaxed text-muted-foreground">
						Add the amount and cadence — we’ll calculate the yearly impact.
					</SheetDescription>
				</SheetHeader>
				<form className="flex flex-1 flex-col gap-5 px-6 py-6" onSubmit={handleDonationSubmit}>
					<div className="grid gap-3">
						<Label htmlFor="charityName">Charity name</Label>
						<Input
							id="charityName"
							value={formState.charity}
							onChange={(event) => setFormState((prev) => ({ ...prev, charity: event.target.value }))}
							placeholder="e.g. Doctors Without Borders"
							autoFocus
							required
						/>
					</div>
					<div className="grid gap-3">
						<Label htmlFor="charityAmount">Amount (EUR)</Label>
						<Input
							id="charityAmount"
							inputMode="numeric"
							pattern="[0-9.]*"
							value={formState.amount}
							onChange={(event) =>
								setFormState((prev) => ({ ...prev, amount: formatNumericInput(event.target.value) }))
							}
							placeholder="e.g. 50"
							required
						/>
					</div>
					<div className="grid gap-3">
						<Label>Frequency</Label>
						<Select
							value={formState.frequency}
							onValueChange={(value) => setFormState((prev) => ({ ...prev, frequency: value as DonationFrequency }))}
						>
							<SelectTrigger>
								<SelectValue placeholder="Pick a frequency" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="monthly">Monthly</SelectItem>
								<SelectItem value="quarterly">Quarterly</SelectItem>
								<SelectItem value="yearly">Yearly</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="mt-auto flex gap-3">
						<Button type="submit" className="flex-1 tracking-[0.25em] uppercase">
							{submitLabel}
						</Button>
						<Button
							type="button"
							variant="outline"
							className="flex-1 tracking-[0.25em] uppercase"
							onClick={() => setIsSheetOpen(false)}
						>
							Cancel
						</Button>
					</div>
				</form>
			</SheetContent>
		</Sheet>
	);
}
