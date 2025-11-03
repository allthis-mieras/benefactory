import { useEffect, useMemo, useState } from 'react';
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

type StoredState = {
	annualIncome: number;
	donations: Donation[];
};

const STORAGE_KEY = 'benefactory.dashboard';
const SHARE_PARAM = 'd';

const BILLIONAIRES = [
	{
		name: 'Jij',
		netWorth: 0,
		source: 'Eigen donaties',
	},
	{
		name: 'Elon Musk',
		netWorth: 226_000_000_000,
		source: 'Forbes Real-Time Billionaires (2024-10)',
	},
	{
		name: 'Jeff Bezos',
		netWorth: 205_000_000_000,
		source: 'Forbes Real-Time Billionaires (2024-10)',
	},
	{
		name: 'Bernard Arnault',
		netWorth: 195_000_000_000,
		source: 'Forbes Real-Time Billionaires (2024-10)',
	},
];

const BAR_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)'];
const PIE_COLORS = [
	'var(--chart-1)',
	'var(--chart-2)',
	'var(--chart-3)',
	'var(--chart-4)',
	'var(--chart-5)',
];

const numberFormatter = new Intl.NumberFormat('nl-NL');
const currencyFormatter = new Intl.NumberFormat('nl-NL', {
	style: 'currency',
	currency: 'EUR',
	maximumFractionDigits: 0,
});
const percentFormatter = new Intl.NumberFormat('nl-NL', { style: 'percent', maximumFractionDigits: 1 });

const sanitizeNumericInput = (value: string) => value.replace(/[^\d]/g, '');

const formatNumericInput = (value: string) => {
	const digits = sanitizeNumericInput(value);
	if (!digits) return '';
	const asNumber = Number(digits);
	return numberFormatter.format(asNumber);
};

const parseNumericInput = (value: string) => {
	const digits = sanitizeNumericInput(value);
	if (!digits) return 0;
	return Number(digits);
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

const encodeState = (state: StoredState) =>
	btoa(encodeURIComponent(JSON.stringify(state)));

const decodeState = (encoded: string): StoredState | null => {
	try {
		return JSON.parse(decodeURIComponent(atob(encoded))) as StoredState;
	} catch {
		return null;
	}
};

export default function DonationApp() {
	const [annualIncome, setAnnualIncome] = useState<number>(0);
	const [donations, setDonations] = useState<Donation[]>([]);
	const [incomeInput, setIncomeInput] = useState<string>('');
	const [formState, setFormState] = useState({
		charity: '',
		amount: '',
		frequency: 'monthly' as DonationFrequency,
	});
	const [chartView, setChartView] = useState<'income' | 'donations'>('income');
	const [isSheetOpen, setIsSheetOpen] = useState(false);
	const [shareLink, setShareLink] = useState<string | null>(null);
	const [message, setMessage] = useState<Message>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const url = new URL(window.location.href);
		const shared = url.searchParams.get(SHARE_PARAM);

		if (shared) {
			const decoded = decodeState(shared);
			if (decoded) {
				setAnnualIncome(decoded.annualIncome ?? 0);
				setIncomeInput(decoded.annualIncome ? numberFormatter.format(decoded.annualIncome) : '');
				setDonations(decoded.donations ?? []);
			} else {
				console.warn('Kon gedeelde link niet lezen.');
			}

			url.searchParams.delete(SHARE_PARAM);
			window.history.replaceState(null, '', url.toString());
			setLoading(false);
			return;
		}

		try {
			const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
			if (raw) {
				const parsed = JSON.parse(raw) as StoredState;
				setAnnualIncome(parsed.annualIncome ?? 0);
				setIncomeInput(parsed.annualIncome ? numberFormatter.format(parsed.annualIncome) : '');
				setDonations(parsed.donations ?? []);
			}
		} catch (error) {
			console.error('Kon opgeslagen gegevens niet lezen', error);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		if (loading) return;
		const snapshot: StoredState = {
			annualIncome,
			donations,
		};
		try {
			globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(snapshot));
		} catch (error) {
			console.error('Kon gegevens niet opslaan', error);
		}
	}, [annualIncome, donations, loading]);

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
		const personalEntry = totals.totalAnnualDonations
			? [{ name: 'Jij', contribution: totals.totalAnnualDonations, color: BAR_COLORS[0], source: 'Eigen donaties' }]
			: [];

		if (totals.percentage <= 0) {
			return personalEntry.length ? personalEntry : [];
		}

		const percentage = totals.percentage;
		const billionaireEntries = BILLIONAIRES.slice(1).map((person, index) => ({
			name: person.name,
			contribution: (person.netWorth * percentage) / 100,
			source: person.source,
			color: BAR_COLORS[(index + 1) % BAR_COLORS.length],
		}));

		return [...personalEntry, ...billionaireEntries];
	}, [totals]);

	const incomePieData = useMemo(() => {
		const donated = totals.totalAnnualDonations;
		const remaining = Math.max(annualIncome - donated, 0);
		return [
			{ name: 'Donaties', value: donated, color: PIE_COLORS[0] },
			{ name: 'Overig inkomen', value: remaining, color: PIE_COLORS[1] },
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

	if (loading) {
		return (
			<Card className="border-dashed">
				<CardHeader>
					<CardTitle>Donatieoverzicht wordt geladen</CardTitle>
					<CardDescription>Even geduld, we bereiden je dashboard voor…</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-4">
					<Skeleton className="h-12 w-full rounded-lg" />
					<Skeleton className="h-48 w-full rounded-lg" />
				</CardContent>
			</Card>
		);
	}

	const handleIncomeSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const parsed = parseNumericInput(incomeInput);
		setAnnualIncome(parsed);
		setIncomeInput(parsed ? numberFormatter.format(parsed) : '');
		setMessage({ type: 'success', text: 'Jaarinkomen opgeslagen.' });
	};

	const handleDonationSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const amount = parseNumericInput(formState.amount);
		if (!formState.charity.trim() || amount <= 0) {
			setMessage({ type: 'error', text: 'Vul een geldige naam en bedrag in.' });
			return;
		}

		const donation: Donation = {
			id: globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2),
			charity_name: formState.charity.trim(),
			amount,
			frequency: formState.frequency,
			annual_amount: computeAnnualAmount(amount, formState.frequency),
			created_at: new Date().toISOString(),
		};

		setDonations((current) => [...current, donation]);
		setFormState((prev) => ({ ...prev, charity: '', amount: '' }));
		setIsSheetOpen(false);
		setMessage({ type: 'success', text: 'Donatie toegevoegd.' });
	};

	const handleRemoveDonation = (id: string) => {
		setDonations((current) => current.filter((donation) => donation.id !== id));
		setMessage({ type: 'info', text: 'Donatie verwijderd.' });
	};

	const handleShare = () => {
		if (!annualIncome && donations.length === 0) {
			setMessage({ type: 'error', text: 'Voeg eerst gegevens toe voordat je een link deelt.' });
			return;
		}

		try {
			const payload: StoredState = { annualIncome, donations };
			const encoded = encodeState(payload);
			const url = new URL(window.location.href);
			url.searchParams.set(SHARE_PARAM, encoded);
			const link = url.toString();
			setShareLink(link);
			if (navigator.clipboard?.writeText) {
				navigator.clipboard.writeText(link).catch(() => {
					// fall back silently
				});
			}
			setMessage({ type: 'success', text: 'Deelbare link gekopieerd naar je klembord.' });
		} catch (error) {
			console.error('Kon link niet genereren', error);
			setMessage({ type: 'error', text: 'Kon geen deelbare link genereren.' });
		}
	};

	return (
		<Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
			<div className="flex flex-col gap-10">
				{message ? (
					<div
						className={cn(
							'rounded-lg border px-4 py-3 text-sm transition-colors',
							message.type === 'success' && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-200',
							message.type === 'error' && 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-200',
							message.type === 'info' && 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-200',
						)}
					>
						{message.text}
					</div>
				) : null}

				<div className="grid gap-6 lg:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle>Jaarinkomen</CardTitle>
							<CardDescription>
								Vul je bruto jaarinkomen in. We berekenen automatisch hoeveel procent van je inkomen je weggeeft.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<form className="flex flex-col gap-4" onSubmit={handleIncomeSubmit}>
								<div className="grid gap-2">
									<Label htmlFor="income">Jaarinkomen (EUR)</Label>
									<Input
										id="income"
										inputMode="numeric"
										pattern="[0-9.]*"
										value={incomeInput}
										onChange={(event) => setIncomeInput(formatNumericInput(event.target.value))}
										placeholder="Bijv. 42.000"
									/>
								</div>
								<Button type="submit" className="w-fit">
									Bedrag opslaan
								</Button>
							</form>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Deel je dashboard</CardTitle>
							<CardDescription>
								Maak een unieke link om deze berekening later te heropenen of te delen met je partner of team.
							</CardDescription>
						</CardHeader>
						<CardContent className="flex flex-col gap-3">
							<Button variant="outline" onClick={handleShare} className="w-fit">
								Deelbare link kopiëren
							</Button>
							{shareLink ? (
								<div className="rounded-lg border border-border/60 bg-background/60 p-3 text-xs text-muted-foreground">
									<p className="font-medium text-foreground">Gegenereerde link</p>
									<p className="truncate font-mono text-xs">{shareLink}</p>
								</div>
							) : null}
							<div className="flex flex-wrap gap-3">
								<Badge variant="outline">
									Totaal giften: {currencyFormatter.format(totals.totalAnnualDonations)}
								</Badge>
								<Badge variant="outline">% inkomen: {percentFormatter.format(totals.percentage / 100)}</Badge>
							</div>
						</CardContent>
					</Card>
				</div>

				<Card>
					<CardHeader className="gap-4 md:flex md:flex-row md:items-center md:justify-between">
						<div>
							<CardTitle>Donatieoverzicht</CardTitle>
							<CardDescription>Houd je goede doelen bij en zie direct hun aandeel.</CardDescription>
						</div>
						<SheetTrigger asChild>
							<Button>Goed doel toevoegen</Button>
						</SheetTrigger>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
							<Badge variant="outline" className="flex flex-col items-start gap-1 px-3 py-2">
								<span className="text-xs uppercase text-muted-foreground">Jaarinkomen</span>
								<span className="text-base font-semibold text-foreground">
									{currencyFormatter.format(annualIncome)}
								</span>
							</Badge>
							<Badge variant="outline" className="flex flex-col items-start gap-1 px-3 py-2">
								<span className="text-xs uppercase text-muted-foreground">Jaarlijkse giften</span>
								<span className="text-base font-semibold text-foreground">
									{currencyFormatter.format(totals.totalAnnualDonations)}
								</span>
							</Badge>
							<Badge variant="outline" className="flex flex-col items-start gap-1 px-3 py-2">
								<span className="text-xs uppercase text-muted-foreground">% van inkomen</span>
								<span className="text-base font-semibold text-foreground">
									{percentFormatter.format(totals.percentage / 100)}
								</span>
							</Badge>
						</div>

						<div className="rounded-lg border bg-card/70">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Goed doel</TableHead>
										<TableHead>Frequentie</TableHead>
										<TableHead className="text-right">Per periode</TableHead>
										<TableHead className="text-right">Per jaar</TableHead>
										<TableHead className="text-right">% van donaties</TableHead>
										<TableHead className="text-right">Actie</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{donationsWithShare.length === 0 ? (
										<TableRow>
											<TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
												Geen donaties toegevoegd. Klik op “Goed doel toevoegen” om te beginnen.
											</TableCell>
										</TableRow>
									) : (
										donationsWithShare.map((donation) => (
											<TableRow key={donation.id}>
												<TableCell className="font-medium">{donation.charity_name}</TableCell>
												<TableCell className="capitalize">{donation.frequency}</TableCell>
												<TableCell className="text-right">
													{currencyFormatter.format(donation.amount)}
												</TableCell>
												<TableCell className="text-right">
													{currencyFormatter.format(donation.annual_amount)}
												</TableCell>
												<TableCell className="text-right">
													{percentFormatter.format((donation.share || 0) / 100)}
												</TableCell>
												<TableCell className="text-right">
													<button
														type="button"
														onClick={() => handleRemoveDonation(donation.id)}
														className="text-xs font-medium text-rose-500 hover:text-rose-400"
													>
														Verwijder
													</button>
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Visualisaties</CardTitle>
						<CardDescription>Kijk naar je donaties ten opzichte van je inkomen of per goed doel.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						<Tabs value={chartView} onValueChange={(value) => setChartView(value as typeof chartView)}>
							<TabsList>
								<TabsTrigger value="income">Inkomen vs donaties</TabsTrigger>
								<TabsTrigger value="donations">Verdeling goede doelen</TabsTrigger>
							</TabsList>
							<TabsContent value="income" className="pt-4">
								{annualIncome === 0 ? (
									<p className="text-sm text-muted-foreground">
										Voer je jaarinkomen in om dit overzicht te bekijken.
									</p>
								) : (
									<div className="h-72 w-full">
										<ResponsiveContainer>
											<PieChart>
												<Pie data={incomePieData} dataKey="value" innerRadius={60} outerRadius={110}>
													{incomePieData.map((entry, index) => (
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
							<TabsContent value="donations" className="pt-4">
								{donationsWithShare.length === 0 ? (
									<p className="text-sm text-muted-foreground">
										Voeg eerst donaties toe om deze grafiek te zien.
									</p>
								) : (
									<div className="h-72 w-full">
										<ResponsiveContainer>
											<PieChart>
												<Pie data={donationPieData} dataKey="value" innerRadius={50} outerRadius={110}>
													{donationPieData.map((entry, index) => (
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
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Vergelijking met miljardairs</CardTitle>
						<CardDescription>
							Zie hoeveel de rijkste ondernemers zouden doneren als ze jouw percentage toepassen (en jouw inleg staat erbij).
						</CardDescription>
					</CardHeader>
					<CardContent className="h-[360px]">
						{comparisonData.length === 0 ? (
							<div className="flex h-full items-center justify-center text-sm text-muted-foreground">
								Vul je inkomen en donaties in om de vergelijkingen te zien.
							</div>
						) : (
							<ResponsiveContainer>
								<BarChart data={comparisonData}>
									<CartesianGrid stroke="var(--border)" strokeDasharray="4 8" vertical={false} />
									<XAxis dataKey="name" stroke="var(--muted-foreground)" />
									<YAxis
										stroke="var(--muted-foreground)"
										tickFormatter={(value) => `${Math.round((value as number) / 1_000_000)}M`}
									/>
									<RechartsTooltip
										cursor={{ fill: 'var(--muted)' }}
										formatter={(value: number, name: string, entry) => [
											currencyFormatter.format(value as number),
											entry?.payload?.source || name,
										]}
									/>
									<Bar dataKey="contribution" radius={[8, 8, 0, 0]}>
										{comparisonData.map((entry, index) => (
											<Cell key={`${entry.name}-${index}`} fill={entry.color || BAR_COLORS[index % BAR_COLORS.length]} />
										))}
									</Bar>
								</BarChart>
							</ResponsiveContainer>
						)}
					</CardContent>
				</Card>

				<Card className="border-dashed">
					<CardHeader>
						<CardTitle>Hoe we jaarbedragen berekenen</CardTitle>
						<CardDescription>Zo vergelijken we alle bedragen eerlijk.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3 text-sm text-muted-foreground">
						<ul className="list-disc space-y-2 pl-5">
							<li>Maandelijks bedrag × 12</li>
							<li>Kwartaalbedrag × 4</li>
							<li>Jaarlijks bedrag blijft gelijk</li>
						</ul>
						<p>
							De percentages en vergelijkingen zijn bedoeld om te inspireren. Werkelijk vermogen en inkomsten van miljardairs variëren per bron en periode.
						</p>
					</CardContent>
				</Card>
			</div>

			<SheetContent side="right">
				<SheetHeader>
					<SheetTitle>Goed doel toevoegen</SheetTitle>
					<SheetDescription>
						Vul het bedrag en de frequentie in. We rekenen het jaarbedrag voor je uit.
					</SheetDescription>
				</SheetHeader>
				<form className="flex flex-1 flex-col gap-4 p-4" onSubmit={handleDonationSubmit}>
					<div className="grid gap-2">
						<Label htmlFor="charityName">Naam van het goede doel</Label>
						<Input
							id="charityName"
							value={formState.charity}
							onChange={(event) => setFormState((prev) => ({ ...prev, charity: event.target.value }))}
							placeholder="Bijv. Artsen zonder Grenzen"
							autoFocus
							required
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="charityAmount">Bedrag (EUR)</Label>
						<Input
							id="charityAmount"
							inputMode="numeric"
							pattern="[0-9.]*"
							value={formState.amount}
							onChange={(event) =>
								setFormState((prev) => ({ ...prev, amount: formatNumericInput(event.target.value) }))
							}
							placeholder="Bijv. 50"
							required
						/>
					</div>
					<div className="grid gap-2">
						<Label>Frequentie</Label>
						<Select
							value={formState.frequency}
							onValueChange={(value) => setFormState((prev) => ({ ...prev, frequency: value as DonationFrequency }))}
						>
							<SelectTrigger>
								<SelectValue placeholder="Kies een frequentie" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="monthly">Maandelijks</SelectItem>
								<SelectItem value="quarterly">Per kwartaal</SelectItem>
								<SelectItem value="yearly">Jaarlijks</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="mt-auto flex gap-2">
						<Button type="submit" className="flex-1">
							Opslaan
						</Button>
						<Button type="button" variant="outline" className="flex-1" onClick={() => setIsSheetOpen(false)}>
							Annuleren
						</Button>
					</div>
				</form>
			</SheetContent>
		</Sheet>
	);
}
