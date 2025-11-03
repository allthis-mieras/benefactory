import ModeToggle from '@/components/mode-toggle';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

type StatusVariant = 'success' | 'warning' | 'error';

type Status = {
	variant: StatusVariant;
	title: string;
	body: string;
};

const STATUS_STYLES: Record<StatusVariant, string> = {
	success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-200',
	warning: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-200',
	error: 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-200',
};

export function SiteHeader({ supabaseStatus }: { supabaseStatus: Status }) {
	return (
		<header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-16 flex h-16 shrink-0 items-center border-b bg-card/60 backdrop-blur">
			<div className="flex w-full items-center gap-3 px-4 lg:px-6">
				<div className="flex flex-1 items-center gap-3">
					<SidebarTrigger className="-ml-1 size-8" />
					<Separator orientation="vertical" className="h-6" />
					<div className="flex flex-col">
						<h1 className="text-lg font-semibold leading-tight">Benefactory dashboard</h1>
						<p className="text-xs text-muted-foreground">
							Analyseer je donaties en spiegel je impact aan de top 1%.
						</p>
					</div>
				</div>
				<div className="flex items-center gap-3">
					<Badge
						variant="outline"
						className={cn('hidden border bg-transparent text-xs md:inline-flex', STATUS_STYLES[supabaseStatus.variant])}
					>
						{supabaseStatus.title}
					</Badge>
					<ModeToggle />
				</div>
			</div>
		</header>
	);
}
