import {
  createNowTableRowFromForm,
  updateNowTableRowFromForm,
} from '../data/actions';
import type {
  NowAdminRow,
  NowTableColumn,
  RelationOptionsMap,
} from '../lib/table-data';
import type { NowTableDefinition } from '../lib/table-registry';
import {
  getFieldHelp,
  getFieldLabel,
  getFieldOptions,
  inferFieldKind,
  isSystemManagedColumn,
} from '../lib/ui-config';
import { inputClass, labelClass, textareaClass } from './ui-kit';

function defaultFromDatabase(column: NowTableColumn) {
  const value = column.column_default ?? '';
  if (column.data_type === 'boolean') return /\btrue\b/i.test(value);
  if (column.data_type === 'jsonb' || column.data_type === 'json') return '{}';
  const numberMatch = value.match(/^\(?(-?\d+(?:\.\d+)?)/);
  return numberMatch?.[1] ?? '';
}

function rawValue(row: NowAdminRow | undefined, column: NowTableColumn) {
  if (!row) return defaultFromDatabase(column);
  const value = row[column.column_name];
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return value;
}

function toDateTimeLocal(value: unknown) {
  if (!value) return '';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  const cairo = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const parts = Object.fromEntries(cairo.map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

function Field({
  column,
  value,
  relations,
  required,
}: {
  column: NowTableColumn;
  value: unknown;
  relations?: Array<{ value: string; label: string }>;
  required: boolean;
}) {
  const name = column.column_name;
  const kind = inferFieldKind(name, column.data_type, value);
  const label = getFieldLabel(name);
  const help = getFieldHelp(name);
  const options = relations ?? getFieldOptions(name);
  const controlName = `field__${name}`;
  const hiddenKind = <input type="hidden" name={`field_kind__${name}`} value={kind} />;

  if (kind === 'boolean') {
    const checked = value === true || value === 'true';
    return (
      <label className="flex cursor-pointer items-start justify-between gap-4 rounded-[20px] border border-black/[0.06] bg-[#fafbfc] p-4 transition hover:border-blue-200 hover:bg-blue-50/40">
        {hiddenKind}
        <span>
          <span className="block text-sm font-semibold text-[#111827]">{label}</span>
          {help ? <span className="mt-1 block text-[11px] font-medium leading-5 text-gray-500">{help}</span> : null}
        </span>
        <input type="checkbox" name={controlName} defaultChecked={checked} className="mt-1 h-5 w-5 shrink-0 accent-blue-600" />
      </label>
    );
  }

  if (options) {
    return (
      <label className={labelClass}>
        {hiddenKind}
        {label}{required ? ' *' : ''}
        <select name={controlName} defaultValue={String(value ?? '')} required={required} className={inputClass}>
          {!required ? <option value="">بدون تحديد</option> : <option value="">اختر...</option>}
          {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        {help ? <span className="mt-1.5 block text-[11px] font-medium leading-5 text-gray-400">{help}</span> : null}
      </label>
    );
  }

  if (kind === 'json') {
    return (
      <label className={labelClass}>
        {hiddenKind}
        {label}{required ? ' *' : ''}
        <textarea
          name={controlName}
          defaultValue={String(value || '{}')}
          required={required}
          spellCheck={false}
          dir="ltr"
          className={`${textareaClass} min-h-36 font-mono text-xs`}
        />
        {help ? <span className="mt-1.5 block text-[11px] font-medium leading-5 text-gray-400">{help}</span> : null}
      </label>
    );
  }

  if (kind === 'textarea') {
    return (
      <label className={labelClass}>
        {hiddenKind}
        {label}{required ? ' *' : ''}
        <textarea name={controlName} defaultValue={String(value ?? '')} required={required} className={textareaClass} />
        {help ? <span className="mt-1.5 block text-[11px] font-medium leading-5 text-gray-400">{help}</span> : null}
      </label>
    );
  }

  const type = kind === 'number' ? 'number' : kind === 'time' ? 'time' : kind === 'datetime' ? 'datetime-local' : kind === 'email' ? 'email' : kind === 'url' ? 'url' : kind === 'phone' ? 'tel' : 'text';
  const renderedValue = kind === 'datetime' ? toDateTimeLocal(value) : String(value ?? '');

  return (
    <label className={labelClass}>
      {hiddenKind}
      {label}{required ? ' *' : ''}
      <input
        type={type}
        step={kind === 'number' ? 'any' : undefined}
        name={controlName}
        defaultValue={renderedValue}
        required={required}
        dir={['url', 'email', 'phone'].includes(kind) ? 'ltr' : undefined}
        className={inputClass}
      />
      {help ? <span className="mt-1.5 block text-[11px] font-medium leading-5 text-gray-400">{help}</span> : null}
    </label>
  );
}

export default function RecordForm({
  definition,
  columns,
  relationOptions,
  row,
  primaryKeyJson,
  mode,
}: {
  definition: NowTableDefinition;
  columns: NowTableColumn[];
  relationOptions: RelationOptionsMap;
  row?: NowAdminRow;
  primaryKeyJson?: string;
  mode: 'create' | 'update';
}) {
  const action = mode === 'create' ? createNowTableRowFromForm : updateNowTableRowFromForm;
  const protectedSet = new Set(definition.protectedColumns ?? []);
  const primaryKeySet = new Set(definition.primaryKey);

  const editable = columns.filter((column) => {
    if (isSystemManagedColumn(column.column_name) || protectedSet.has(column.column_name)) return false;
    if (mode === 'update' && primaryKeySet.has(column.column_name)) return false;
    if (mode === 'create' && column.column_name === 'id' && column.column_default) return false;
    return true;
  });

  const advanced = editable.filter((column) => ['jsonb', 'json'].includes(column.data_type));
  const normal = editable.filter((column) => !['jsonb', 'json'].includes(column.data_type));

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="table" value={definition.table} />
      {primaryKeyJson ? <input type="hidden" name="primary_key" value={primaryKeyJson} /> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {normal.map((column) => {
          const value = rawValue(row, column);
          const required = !column.is_nullable && !column.column_default && inferFieldKind(column.column_name, column.data_type, value) !== 'boolean';
          return (
            <Field
              key={column.column_name}
              column={column}
              value={value}
              relations={relationOptions[column.column_name]}
              required={required}
            />
          );
        })}
      </div>

      {advanced.length > 0 ? (
        <details className="rounded-[20px] border border-black/[0.06] bg-[#fafbfc]">
          <summary className="cursor-pointer list-none p-4 text-sm font-semibold text-gray-600">
            إعدادات متقدمة — غالبًا لن تحتاج لتعديلها
          </summary>
          <div className="grid gap-4 border-t border-gray-200 p-4 md:grid-cols-2">
            {advanced.map((column) => (
              <Field
                key={column.column_name}
                column={column}
                value={rawValue(row, column)}
                relations={relationOptions[column.column_name]}
                required={!column.is_nullable && !column.column_default}
              />
            ))}
          </div>
        </details>
      ) : null}

      <div className="flex justify-end border-t border-gray-100 pt-4">
        <button
          type="submit"
          className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-blue-600 bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.22)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-blue-700 hover:shadow-[0_12px_26px_rgba(37,99,235,0.28)]"
        >
          {mode === 'create' ? 'إضافة' : 'حفظ التعديلات'}
        </button>
      </div>
    </form>
  );
}
