/* eslint-disable react-refresh/only-export-components */
/* eslint-disable no-unused-vars */
import React from 'react';
import { 
    LayoutTemplate, Square, Type, Image as ImageIcon, Video, Box, Minus, 
    Sidebar as SidebarIcon, Link, Navigation, GripHorizontal, 
    PanelTop, List, CheckSquare, CircleDot, ChevronDown, Calendar, UploadCloud,
    Map, BarChart, Table, CreditCard, Monitor, Share2, PanelLeft
} from 'lucide-react';

// === 1. Layout and structure ===
const MockupContainerBox = () => (
    <div style={{ width: '100%', height: '100%', border: '2px dashed #475569', borderRadius: '4px', backgroundColor: 'rgba(15, 23, 42, 0.5)' }}></div>
);
const MockupRow = () => (
    <div style={{ width: '100%', height: '100%', display: 'flex', gap: '8px' }}>
        <div style={{ flex: 1, backgroundColor: 'rgba(71, 85, 105, 0.4)', borderRadius: '2px' }}></div>
        <div style={{ flex: 1, backgroundColor: 'rgba(71, 85, 105, 0.4)', borderRadius: '2px' }}></div>
        <div style={{ flex: 1, backgroundColor: 'rgba(71, 85, 105, 0.4)', borderRadius: '2px' }}></div>
    </div>
);
const MockupColumn = () => (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ flex: 1, backgroundColor: 'rgba(71, 85, 105, 0.4)', borderRadius: '2px' }}></div>
        <div style={{ flex: 1, backgroundColor: 'rgba(71, 85, 105, 0.4)', borderRadius: '2px' }}></div>
        <div style={{ flex: 1, backgroundColor: 'rgba(71, 85, 105, 0.4)', borderRadius: '2px' }}></div>
    </div>
);
const MockupSectionDivider = () => (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
        <div style={{ flex: 1, height: '2px', backgroundColor: '#475569' }}></div>
    </div>
);
const MockupSpacer = () => (
    <div style={{ width: '100%', height: '100%', backgroundColor: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(71, 85, 105, 0.2) 10px, rgba(71, 85, 105, 0.2) 20px)' }}></div>
);
const MockupSidebar = () => (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#1E2B3C', display: 'flex', flexDirection: 'column', padding: '16px', gap: '12px', borderRight: '1px solid #334155' }}>
        <div style={{ width: '80%', height: '12px', backgroundColor: '#38bdf8', borderRadius: '2px', marginBottom: '16px' }}></div>
        <div style={{ width: '100%', height: '8px', backgroundColor: '#475569', borderRadius: '2px' }}></div>
        <div style={{ width: '90%', height: '8px', backgroundColor: '#475569', borderRadius: '2px' }}></div>
        <div style={{ width: '95%', height: '8px', backgroundColor: '#475569', borderRadius: '2px' }}></div>
        <div style={{ width: '85%', height: '8px', backgroundColor: '#475569', borderRadius: '2px' }}></div>
    </div>
);

// === 2. Basic content ===
const MockupHeadingText = () => (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ width: '80%', height: '60%', backgroundColor: '#e2e8f0', borderRadius: '4px' }}></div>
        <div style={{ width: '50%', height: '60%', backgroundColor: '#e2e8f0', borderRadius: '4px' }}></div>
    </div>
);
const MockupParagraphText = () => (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ width: '100%', height: '8px', backgroundColor: '#94a3b8', borderRadius: '2px' }}></div>
        <div style={{ width: '100%', height: '8px', backgroundColor: '#94a3b8', borderRadius: '2px' }}></div>
        <div style={{ width: '90%', height: '8px', backgroundColor: '#94a3b8', borderRadius: '2px' }}></div>
        <div style={{ width: '60%', height: '8px', backgroundColor: '#94a3b8', borderRadius: '2px' }}></div>
    </div>
);
const MockupImageBlock = () => (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#334155', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ImageIcon color="#94a3b8" size={32} />
    </div>
);
const MockupVideoEmbed = () => (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#0f172a', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #334155' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 0, height: 0, borderTop: '10px solid transparent', borderBottom: '10px solid transparent', borderLeft: '16px solid #e2e8f0', marginLeft: '4px' }}></div>
        </div>
    </div>
);
const MockupIcon = () => (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', backgroundColor: '#475569' }}>
        <Square size="50%" color="#cbd5e1" />
    </div>
);
const MockupBulletedList = () => (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '8px' }}>
        {[1,2,3].map(i => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#38bdf8' }}></div>
                <div style={{ flex: 1, height: '8px', backgroundColor: '#94a3b8', borderRadius: '2px' }}></div>
            </div>
        ))}
    </div>
);

// === 3. Navigation and interaction ===
const MockupNavbarComp = () => (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#1E2B3C', display: 'flex', alignItems: 'center', padding: '0 16px', borderBottom: '1px solid #334155' }}>
        <div style={{ width: '30px', height: '12px', backgroundColor: '#38bdf8', borderRadius: '4px' }}></div>
        <div style={{ display: 'flex', gap: '16px', marginLeft: 'auto' }}>
            <div style={{ width: '40px', height: '8px', backgroundColor: '#64748b', borderRadius: '2px' }}></div>
            <div style={{ width: '40px', height: '8px', backgroundColor: '#64748b', borderRadius: '2px' }}></div>
        </div>
    </div>
);
const MockupButtonComp = () => (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#06b6d4', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40%', height: '6px', backgroundColor: '#ffffff', borderRadius: '2px' }}></div>
    </div>
);
const MockupHyperlink = () => (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
        <div style={{ width: '100%', height: '8px', backgroundColor: '#38bdf8', borderRadius: '2px' }}></div>
        <div style={{ position: 'absolute', bottom: '0px', left: 0, width: '100%', height: '1px', backgroundColor: '#38bdf8' }}></div>
    </div>
);
const MockupBreadcrumbs = () => (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '30px', height: '6px', backgroundColor: '#94a3b8', borderRadius: '2px' }}></div>
        <div style={{ width: '6px', height: '6px', backgroundColor: '#475569' }}></div>
        <div style={{ width: '40px', height: '6px', backgroundColor: '#94a3b8', borderRadius: '2px' }}></div>
        <div style={{ width: '6px', height: '6px', backgroundColor: '#475569' }}></div>
        <div style={{ width: '50px', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '2px' }}></div>
    </div>
);
const MockupTabbedPanel = () => (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', gap: '4px', padding: '0 8px' }}>
            <div style={{ width: '60px', height: '20px', backgroundColor: '#1E2B3C', borderTopLeftRadius: '4px', borderTopRightRadius: '4px' }}></div>
            <div style={{ width: '60px', height: '20px', backgroundColor: 'rgba(30, 43, 60, 0.5)', borderTopLeftRadius: '4px', borderTopRightRadius: '4px' }}></div>
        </div>
        <div style={{ flex: 1, backgroundColor: '#1E2B3C', borderRadius: '4px', borderTopLeftRadius: 0 }}></div>
    </div>
);
const MockupAccordion = () => (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ height: '30%', backgroundColor: '#1E2B3C', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px' }}>
            <div style={{ width: '40%', height: '6px', backgroundColor: '#cbd5e1', borderRadius: '2px' }}></div>
            <ChevronDown size={14} color="#94a3b8" />
        </div>
        <div style={{ flex: 1, backgroundColor: 'rgba(30, 43, 60, 0.3)', borderRadius: '4px', padding: '12px' }}>
            <div style={{ width: '100%', height: '6px', backgroundColor: '#64748b', borderRadius: '2px', marginBottom: '6px' }}></div>
            <div style={{ width: '80%', height: '6px', backgroundColor: '#64748b', borderRadius: '2px' }}></div>
        </div>
    </div>
);

// === 4. Data entry and forms ===
const MockupTextInput = () => (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#0f172a', borderRadius: '4px', border: '1px solid #334155', display: 'flex', alignItems: 'center', padding: '0 12px' }}>
        <div style={{ width: '30%', height: '6px', backgroundColor: '#475569', borderRadius: '2px' }}></div>
    </div>
);
const MockupTextarea = () => (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#0f172a', borderRadius: '4px', border: '1px solid #334155', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ width: '40%', height: '6px', backgroundColor: '#475569', borderRadius: '2px' }}></div>
        <div style={{ width: '30%', height: '6px', backgroundColor: '#475569', borderRadius: '2px' }}></div>
    </div>
);
const MockupCheckbox = () => (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '16px', height: '16px', borderRadius: '2px', backgroundColor: '#06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '8px', height: '4px', borderBottom: '2px solid white', borderLeft: '2px solid white', transform: 'rotate(-45deg)', marginBottom: '2px' }}></div>
        </div>
        <div style={{ flex: 1, height: '8px', backgroundColor: '#cbd5e1', borderRadius: '2px' }}></div>
    </div>
);
const MockupRadioButton = () => (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid #06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#06b6d4' }}></div>
        </div>
        <div style={{ flex: 1, height: '8px', backgroundColor: '#cbd5e1', borderRadius: '2px' }}></div>
    </div>
);
const MockupDropdownMenu = () => (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#0f172a', borderRadius: '4px', border: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px' }}>
        <div style={{ width: '40%', height: '6px', backgroundColor: '#94a3b8', borderRadius: '2px' }}></div>
        <ChevronDown size={14} color="#94a3b8" />
    </div>
);
const MockupDatePicker = () => (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#0f172a', borderRadius: '4px', border: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '12px', padding: '0 12px' }}>
        <Calendar size={14} color="#94a3b8" />
        <div style={{ width: '60%', height: '6px', backgroundColor: '#94a3b8', borderRadius: '2px' }}></div>
    </div>
);
const MockupFileUpload = () => (
    <div style={{ width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.5)', borderRadius: '8px', border: '2px dashed #475569', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        <UploadCloud size={24} color="#94a3b8" />
        <div style={{ width: '40%', height: '6px', backgroundColor: '#64748b', borderRadius: '2px' }}></div>
    </div>
);

// === 5. Media and advanced components ===
const MockupImageCarousel = () => (
    <div style={{ width: '100%', height: '100%', position: 'relative', backgroundColor: '#334155', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', left: '8px', width: '20px', height: '20px', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderRight: '6px solid white' }}></div></div>
        <ImageIcon color="#94a3b8" size={32} />
        <div style={{ position: 'absolute', right: '8px', width: '20px', height: '20px', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderLeft: '6px solid white' }}></div></div>
        <div style={{ position: 'absolute', bottom: '8px', display: 'flex', gap: '4px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'white' }}></div>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.5)' }}></div>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.5)' }}></div>
        </div>
    </div>
);
const MockupMapEmbed = () => (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#cbd5e1', borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
            <Map size={32} color="#64748b" />
        </div>
        <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '2px' }}><div style={{ width: '10px', height: '2px', backgroundColor: '#333' }}></div><div style={{ width: '2px', height: '10px', backgroundColor: '#333', position: 'absolute' }}></div></div>
            <div style={{ width: '20px', height: '20px', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '2px' }}><div style={{ width: '10px', height: '2px', backgroundColor: '#333' }}></div></div>
        </div>
    </div>
);
const MockupProgressBar = () => (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
        <div style={{ width: '100%', height: '8px', backgroundColor: '#334155', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: '60%', height: '100%', backgroundColor: '#06b6d4' }}></div>
        </div>
    </div>
);
const MockupDataTable = () => (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#1E2B3C', borderRadius: '4px', border: '1px solid #334155', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: '24px', backgroundColor: 'rgba(255,255,255,0.05)', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', padding: '0 8px', gap: '8px' }}>
            <div style={{ flex: 1, height: '6px', backgroundColor: '#94a3b8', borderRadius: '2px' }}></div>
            <div style={{ flex: 1, height: '6px', backgroundColor: '#94a3b8', borderRadius: '2px' }}></div>
            <div style={{ flex: 1, height: '6px', backgroundColor: '#94a3b8', borderRadius: '2px' }}></div>
        </div>
        {[1,2,3].map(i => (
            <div key={i} style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 8px', gap: '8px', borderBottom: i !== 3 ? '1px solid rgba(255,255,255,0.02)' : 'none' }}>
                <div style={{ flex: 1, height: '4px', backgroundColor: '#64748b', borderRadius: '2px' }}></div>
                <div style={{ flex: 1, height: '4px', backgroundColor: '#64748b', borderRadius: '2px' }}></div>
                <div style={{ flex: 1, height: '4px', backgroundColor: '#64748b', borderRadius: '2px' }}></div>
            </div>
        ))}
    </div>
);
const MockupInformationCard = () => (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#1E2B3C', borderRadius: '8px', border: '1px solid #334155', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ width: '60%', height: '12px', backgroundColor: '#cbd5e1', borderRadius: '2px' }}></div>
        <div style={{ width: '100%', height: '6px', backgroundColor: '#64748b', borderRadius: '2px' }}></div>
        <div style={{ width: '90%', height: '6px', backgroundColor: '#64748b', borderRadius: '2px' }}></div>
        <div style={{ marginTop: 'auto', width: '80px', height: '24px', backgroundColor: '#06b6d4', borderRadius: '4px' }}></div>
    </div>
);
const MockupModalPopup = () => (
    <div style={{ width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '70%', height: '70%', backgroundColor: '#1E2B3C', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ height: '30px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 8px' }}>
                <div style={{ width: '10px', height: '10px', backgroundColor: '#ef4444', borderRadius: '50%' }}></div>
            </div>
            <div style={{ flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ width: '50%', height: '10px', backgroundColor: '#cbd5e1', borderRadius: '2px' }}></div>
                <div style={{ width: '100%', height: '6px', backgroundColor: '#64748b', borderRadius: '2px' }}></div>
                <div style={{ width: '80%', height: '6px', backgroundColor: '#64748b', borderRadius: '2px' }}></div>
                <div style={{ marginTop: 'auto', alignSelf: 'flex-end', width: '60px', height: '20px', backgroundColor: '#06b6d4', borderRadius: '4px' }}></div>
            </div>
        </div>
    </div>
);
const MockupSocialGroup = () => (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#1da1f2' }}></div>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#3b5998' }}></div>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#e1306c' }}></div>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#0077b5' }}></div>
    </div>
);


export const MOCKUP_CATEGORIES = [
    {
        id: 'layout',
        title: 'Layout & Structure',
        items: ['container', 'row', 'column', 'divider', 'spacer', 'sidebar']
    },
    {
        id: 'basic',
        title: 'Basic Content',
        items: ['heading', 'paragraph', 'imageBlock', 'videoEmbed', 'icon', 'bulletList']
    },
    {
        id: 'navigation',
        title: 'Navigation & Interaction',
        items: ['navbar', 'button', 'hyperlink', 'breadcrumbs', 'tabbedPanel', 'accordion']
    },
    {
        id: 'forms',
        title: 'Data Entry & Forms',
        items: ['textInput', 'textarea', 'checkbox', 'radio', 'dropdown', 'datePicker', 'fileUpload']
    },
    {
        id: 'media',
        title: 'Media & Advanced',
        items: ['imageCarousel', 'mapEmbed', 'progressBar', 'dataTable', 'infoCard', 'modal', 'socialIcons']
    }
];

export const MOCKUP_TYPES = {
    // Layout
    container: { component: MockupContainerBox, label: 'Container Box', defaultW: 300, defaultH: 200, icon: Box },
    row: { component: MockupRow, label: 'Row', defaultW: 400, defaultH: 60, icon: GripHorizontal },
    column: { component: MockupColumn, label: 'Column', defaultW: 100, defaultH: 300, icon: GripHorizontal },
    divider: { component: MockupSectionDivider, label: 'Section Divider', defaultW: 400, defaultH: 20, icon: Minus },
    spacer: { component: MockupSpacer, label: 'Spacer', defaultW: 100, defaultH: 50, icon: Box },
    sidebar: { component: MockupSidebar, label: 'Sidebar', defaultW: 200, defaultH: 400, icon: PanelLeft },
    
    // Basic
    heading: { component: MockupHeadingText, label: 'Heading Text', defaultW: 250, defaultH: 40, icon: Type },
    paragraph: { component: MockupParagraphText, label: 'Paragraph Text', defaultW: 300, defaultH: 80, icon: Type },
    imageBlock: { component: MockupImageBlock, label: 'Image Block', defaultW: 150, defaultH: 150, icon: ImageIcon },
    videoEmbed: { component: MockupVideoEmbed, label: 'Video Embed', defaultW: 320, defaultH: 180, icon: Video },
    icon: { component: MockupIcon, label: 'Icon', defaultW: 50, defaultH: 50, icon: CircleDot },
    bulletList: { component: MockupBulletedList, label: 'Bulleted List', defaultW: 200, defaultH: 120, icon: List },

    // Navigation
    navbar: { component: MockupNavbarComp, label: 'Navigation Bar', defaultW: 600, defaultH: 60, icon: PanelTop },
    button: { component: MockupButtonComp, label: 'Button', defaultW: 120, defaultH: 40, icon: Square },
    hyperlink: { component: MockupHyperlink, label: 'Hyperlink', defaultW: 80, defaultH: 20, icon: Link },
    breadcrumbs: { component: MockupBreadcrumbs, label: 'Breadcrumbs', defaultW: 250, defaultH: 20, icon: Navigation },
    tabbedPanel: { component: MockupTabbedPanel, label: 'Tabbed Panel', defaultW: 400, defaultH: 250, icon: LayoutTemplate },
    accordion: { component: MockupAccordion, label: 'Accordion Menu', defaultW: 300, defaultH: 150, icon: ChevronDown },

    // Forms
    textInput: { component: MockupTextInput, label: 'Text Input', defaultW: 200, defaultH: 40, icon: Type },
    textarea: { component: MockupTextarea, label: 'Textarea', defaultW: 250, defaultH: 100, icon: Type },
    checkbox: { component: MockupCheckbox, label: 'Checkbox', defaultW: 120, defaultH: 24, icon: CheckSquare },
    radio: { component: MockupRadioButton, label: 'Radio Button', defaultW: 120, defaultH: 24, icon: CircleDot },
    dropdown: { component: MockupDropdownMenu, label: 'Dropdown Menu', defaultW: 200, defaultH: 40, icon: ChevronDown },
    datePicker: { component: MockupDatePicker, label: 'Date Picker', defaultW: 200, defaultH: 40, icon: Calendar },
    fileUpload: { component: MockupFileUpload, label: 'File Upload Zone', defaultW: 300, defaultH: 150, icon: UploadCloud },

    // Advanced
    imageCarousel: { component: MockupImageCarousel, label: 'Image Carousel', defaultW: 400, defaultH: 250, icon: ImageIcon },
    mapEmbed: { component: MockupMapEmbed, label: 'Map Embed', defaultW: 300, defaultH: 300, icon: Map },
    progressBar: { component: MockupProgressBar, label: 'Progress Bar', defaultW: 200, defaultH: 20, icon: BarChart },
    dataTable: { component: MockupDataTable, label: 'Data Table', defaultW: 500, defaultH: 250, icon: Table },
    infoCard: { component: MockupInformationCard, label: 'Info Card', defaultW: 250, defaultH: 200, icon: CreditCard },
    modal: { component: MockupModalPopup, label: 'Modal Popup', defaultW: 600, defaultH: 400, icon: Monitor },
    socialIcons: { component: MockupSocialGroup, label: 'Social Media Icons', defaultW: 200, defaultH: 40, icon: Share2 }
};
