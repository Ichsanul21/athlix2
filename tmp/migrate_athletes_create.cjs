const fs = require('fs');
const indexFile = 'd:/ICHSAN/Prototype/athlix2/resources/js/Pages/Athletes/Index.jsx';
const createFile = 'd:/ICHSAN/Prototype/athlix2/resources/js/Pages/Athletes/Create.jsx';

let indexContent = fs.readFileSync(indexFile, 'utf8');
const createContent = fs.readFileSync(createFile, 'utf8');

// Extract the form
const formStartM = createContent.match(/<form onSubmit=\{handleSubmit\}[^>]*>/);
const formStart = formStartM.index;
const formEnd = createContent.indexOf('</form>', formStart) + 7;
let formString = createContent.substring(formStart, formEnd);
formString = formString.replace('handleSubmit', 'handleCreateSubmit');
formString = formString.replace(/<Button type="submit".*?>[\s\S]*?<\/Button>/, `<Button type="submit" className="w-full h-12 text-lg" disabled={processing}>
                                        {processing && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                                        Daftarkan Atlet
                                    </Button>`);

// 1. Rewrite imports
indexContent = indexContent.replace("import { Head, Link, router } from '@inertiajs/react';", "import { Head, Link, router, useForm } from '@inertiajs/react';");
indexContent = indexContent.replace("import { Search, Plus, ChevronRight } from 'lucide-react';", "import { Search, Plus, ChevronRight, Loader2, X } from 'lucide-react';\nimport DbSelect from '@/Components/DbSelect';\nimport Modal from '@/Components/Modal';");
indexContent = indexContent.replace("import { useState } from 'react';", "import { useState, useEffect } from 'react';");

// 2. Add state & logic
const newCompDef = `export default function Index({ auth, athletes, flash, filters, belts, suggestedAthleteCode, dojos = [] }) {
    const [search, setSearch] = useState(filters?.search || '');
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const initialBeltId = belts?.[0]?.id ?? '';
    const initialDojoId = dojos?.[0]?.id ?? '';
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        full_name: '',
        athlete_code: suggestedAthleteCode || '',
        current_belt_id: initialBeltId,
        dojo_id: initialDojoId,
        birth_place: '',
        phone_number: '',
        dob: '',
        gender: 'M',
        specialization: 'both',
        parent_name: '',
        parent_phone_number: '',
        parent_email: '',
        parent_relation_type: 'parent',
        latest_height: '',
        latest_weight: '',
        class_note: '',
        photo: null,
        doc_kk: null,
        doc_akte: null,
        doc_ktp: null,
    });

    useEffect(() => {
        if (belts?.length > 0 && !data.current_belt_id) setData('current_belt_id', belts[0].id);
    }, [belts, data.current_belt_id, setData]);

    useEffect(() => {
        if (dojos?.length > 0 && !data.dojo_id) setData('dojo_id', dojos[0].id);
    }, [dojos, data.dojo_id, setData]);

    useEffect(() => {
        if (suggestedAthleteCode && !data.athlete_code) setData('athlete_code', suggestedAthleteCode);
    }, [suggestedAthleteCode, data.athlete_code, setData]);

    const handleCreateSubmit = (e) => {
        e.preventDefault();
        post(route('athletes.store'), {
            forceFormData: true,
            onSuccess: () => {
                reset();
                clearErrors();
                setIsCreateOpen(false);
            }
        });
    };`;

indexContent = indexContent.replace("export default function Index({ auth, athletes, flash, filters }) {\n    const [search, setSearch] = useState(filters?.search || '');", newCompDef);

// 3. Replace button
const btnRegex = /<Link href=\{route\('athletes\.create'\)\}>[\s\S]*?Registrasi Atlet[\s\S]*?<\/Link>/m;
indexContent = indexContent.replace(btnRegex, `<Button onClick={() => setIsCreateOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Registrasi Atlet
                            </Button>`);

// 4. Append modal
const modalTpl = `            <Modal show={isCreateOpen} onClose={() => setIsCreateOpen(false)} maxWidth="2xl">
                <div className="flex items-center justify-between p-4 mb-2 border-b border-neutral-100">
                    <h3 className="text-lg font-black uppercase tracking-tight">Registrasi Atlet Baru</h3>
                    <button type="button" onClick={() => setIsCreateOpen(false)} className="text-neutral-500 hover:text-neutral-700">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 max-h-[85vh] overflow-y-auto w-full">
                    ${formString}
                </div>
            </Modal>
        </AdminLayout>`;

if (indexContent.indexOf("</AdminLayout>") !== -1) {
    indexContent = indexContent.replace(/\s*<\/AdminLayout>\s*$/, "\n" + modalTpl + "\n");
} else {
    console.error("NO AdminLayout found to replace!");
}

fs.writeFileSync(indexFile, indexContent);
console.log("Migration complete!");
